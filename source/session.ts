// :copyright: Copyright (c) 2016 ftrack
import moment from "moment";
import loglevel from "loglevel";
import { v4 as uuidV4 } from "uuid";

import { EventHub } from "./event_hub";
import * as operation from "./operation";
import {
  ServerPermissionDeniedError,
  ServerValidationError,
  ServerError,
  AbortError,
  CreateComponentError,
} from "./error";
import { SERVER_LOCATION_ID } from "./constant";

import normalizeString from "./util/normalize_string";
import type {
  ActionResponse,
  CallOptions,
  CreateComponentOptions,
  CreateResponse,
  Data,
  DeleteResponse,
  GetUploadMetadataResponse,
  IsTuple,
  MutationOptions,
  QueryOptions,
  QueryResponse,
  QuerySchemasResponse,
  QueryServerInformationResponse,
  ResponseError,
  Schema,
  SearchOptions,
  SearchResponse,
  SessionOptions,
  UpdateResponse,
} from "./types";
import { convertToIsoString } from "./util/convert_to_iso_string";

const logger = loglevel.getLogger("ftrack_api");

const ENCODE_DATETIME_FORMAT = "YYYY-MM-DDTHH:mm:ss";

/**
 * Create component from *file* and add to server location.
 *
 * @param  {fileName} The name of the file.
 * @return {array} Array with [basename, extension] from filename.
 */
function splitFileExtension(fileName: string) {
  let basename = fileName || "";
  let extension =
    fileName.slice((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1) ||
    "";

  if (extension.length) {
    extension = `.${extension}`;
    basename = fileName.slice(0, -1 * extension.length) || "";
  }

  return [basename, extension];
}

/**
 * ftrack API session
 * @class  Session
 *
 */
export class Session {
  apiUser: string;
  apiKey: string;
  serverUrl: string;
  apiEndpoint: string;
  eventHub: EventHub;
  clientToken: string | null;
  initialized: boolean;
  initializing: Promise<Session>;
  serverInformation?: Data;
  schemas?: Schema[];
  serverVersion?: string;
  additionalHeaders: Data;

  /**
   * Construct Session instance with API credentials.
   *
   * @param  {string}  serverUrl -                  ftrack server URL
   * @param  {string}  apiUser -                    ftrack username for API user.
   * @param  {string}  apiKey -                     User API Key
   * @param  {Object}  options  -                   options
   * @param  {Boolean} [options.autoConnectEventHub=false] - Automatically connect to event hub,
   * @param  {Array|null} [options.serverInformationValues] - List of server information values to retrieve.
   * @param  {Object}  [options.eventHubOptions={}] - Options to configure event hub with.
   * @param  {string} [options.clientToken] - Client token for update events.
   * @param  {string} [options.apiEndpoint=/api] - API endpoint.
   * @param {object} [options.headers] - Additional headers to send with the request
   * @param {object} [options.strictApi] - Turn on strict API mode
   * @param {object} options.decodeDatesAsIso - Decode dates as ISO strings instead of moment objects
   *
   * @constructs Session
   */
  constructor(
    serverUrl: string,
    apiUser: string,
    apiKey: string,
    {
      autoConnectEventHub = false,
      serverInformationValues,
      eventHubOptions = {},
      clientToken,
      apiEndpoint = "/api",
      additionalHeaders = {},
      strictApi = false,
    }: SessionOptions = {}
  ) {
    if (!serverUrl || !apiUser || !apiKey) {
      throw new Error(
        "Invalid arguments, please construct Session with " +
          "*serverUrl*, *apiUser* and *apiKey*."
      );
    }

    /**
     * Username of ftrack user used by API
     * @memberof Session
     * @instance
     * @type {string}
     */
    this.apiUser = apiUser;

    /**
     * API Key
     * @memberof Session
     * @instance
     * @type {string}
     */
    this.apiKey = apiKey;

    /**
     * ftrack server URL
     * @memberof Session
     * @instance
     * @type {string}
     */
    this.serverUrl = serverUrl;

    /**
     * API Endpoint. Specified relative to server URL with leading slash.
     * @memberof Session
     * @instance
     * @type {string}
     */
    this.apiEndpoint = apiEndpoint;

    /**
     * allows setting additional headers to be sent with each request
     * @memberof Session
     * @instance
     * @type {Data}
     */
    this.additionalHeaders = additionalHeaders;

    if (strictApi) {
      this.additionalHeaders = {
        ...additionalHeaders,
        "ftrack-strict-api": "true",
      };
    }

    /**
     * session event hub
     * @memberof Session
     * @instance
     * @type {EventHub}
     */
    this.eventHub = new EventHub(serverUrl, apiUser, apiKey, eventHubOptions);

    if (autoConnectEventHub) {
      this.eventHub.connect();
    }

    if (clientToken) {
      this.clientToken = clientToken;
    } else {
      this.clientToken = `ftrack-javascript-api--${uuidV4()}`;
    }

    // Always include is_timezone_support_enabled as required by API.
    if (
      serverInformationValues &&
      !serverInformationValues.includes("is_timezone_support_enabled")
    ) {
      serverInformationValues.push("is_timezone_support_enabled");
    }

    const operations: operation.Operation[] = [
      {
        action: "query_server_information",
        values: serverInformationValues,
      },
      { action: "query_schemas" },
    ];

    /**
     * true if session is initialized
     * @memberof Session
     * @instance
     * @type {Boolean}
     */
    this.initialized = false;

    /**
     * Resolved once session is initialized.
     * @memberof Session
     * @instance
     * @type {Promise}
     */
    this.initializing = this.call<
      [QueryServerInformationResponse, QuerySchemasResponse]
    >(operations).then((responses) => {
      this.serverInformation = responses[0];
      this.schemas = responses[1];
      this.serverVersion = this.serverInformation.version;
      this.initialized = true;

      return Promise.resolve(this);
    });
  }

  /**
   * Get primary key attributes from schema
   *
   * @return {Array|null} List of primary key attributes.
   */
  getPrimaryKeyAttributes(entityType: string): string[] | null {
    if (!this.schemas) {
      logger.warn("Schemas not available.");
      return null;
    }
    const schema = this.schemas.find((item) => item.id === entityType);
    if (!schema || !schema.primary_key || !schema.primary_key.length) {
      logger.warn("Primary key could not be found for: ", entityType);
      return null;
    }
    return schema.primary_key;
  }

  /**
   * Get identifying key for *entity*
   *
   * @return {String|null} Identifying key for *entity*
   */
  getIdentifyingKey(entity: Data) {
    const primaryKeys = this.getPrimaryKeyAttributes(entity.__entity_type__);
    if (primaryKeys) {
      return [
        entity.__entity_type__,
        ...primaryKeys.map((attribute: string) => entity[attribute]),
      ].join(",");
    }
    return null;
  }

  /**
   * Return encoded *data* as JSON string.
   *
   * This will translate date, moment, and dayjs  objects into ISO8601 string representation in UTC.
   *
   * @private
   * @param  {*} data  The data to encode.
   * @return {*}      Encoded data
   */
  private encode(data: any): any {
    if (data && data.constructor === Array) {
      return data.map((item) => this.encode(item));
    }

    if (data && data.constructor === Object) {
      const out: Data = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          out[key] = this.encode(data[key]);
        }
      }

      return out;
    }

    const date = convertToIsoString(data);
    if (date) {
      if (
        this.serverInformation &&
        this.serverInformation.is_timezone_support_enabled
      ) {
        // Ensure that the moment object is in UTC and format
        // to timezone naive string.
        return {
          __type__: "datetime",
          value: date,
        };
      }

      // Ensure that the moment object is in local time zone and format
      // to timezone naive string.
      return {
        __type__: "datetime",
        value: moment(date).local().format(ENCODE_DATETIME_FORMAT),
      };
    }

    return data;
  }

  /** Return error instance from *response*.
   *
   * @private
   * @param  {*} response  A server error response object.
   * @return {*}      error instance.
   */
  private getErrorFromResponse(response: ResponseError) {
    let ErrorClass;

    if (response.exception === "AbortError") {
      ErrorClass = AbortError;
    } else if (response.exception === "ValidationError") {
      ErrorClass = ServerValidationError;
    } else if (
      response.exception === "FTAuthenticationError" ||
      response.exception === "PermissionError"
    ) {
      ErrorClass = ServerPermissionDeniedError;
    } else {
      ErrorClass = ServerError;
    }

    const error = new ErrorClass(response.content, response.error_code);

    return error;
  }

  /**
   * Iterate *data* and decode entities with special encoding logic.
   *
   * Iterates recursively through objects and arrays.
   *
   * Will merge ftrack entities multiple occurrences which have been
   * de-duplicated in the back end and point them to a single object in
   * *identityMap*.
   *
   * datetime objects will be converted to timezone-aware moment objects.
   *
   * @private
   * @param  {*} data  The data to decode.
   * @return {*}      Decoded data
   */

  private decode(
    data: any,
    identityMap: Data = {},
    decodeDatesAsIso: boolean = false
  ): any {
    if (Array.isArray(data)) {
      return this._decodeArray(data, identityMap, decodeDatesAsIso);
    }
    if (typeof data === "object" && data?.constructor === Object) {
      if (data.__entity_type__) {
        return this._mergeEntity(data, identityMap, decodeDatesAsIso);
      }
      if (data.__type__ === "datetime" && decodeDatesAsIso) {
        return this._decodeDateTimeAsIso(data);
      } else if (data.__type__ === "datetime") {
        return this._decodeDateTimeAsMoment(data);
      }
      return this._decodePlainObject(data, identityMap, decodeDatesAsIso);
    }
    return data;
  }

  /**
   * Decode datetime *data* into ISO 8601 strings.
   *
   * Translate objects with __type__ equal to 'datetime' into moment
   * datetime objects. If time zone support is enabled on the server the date
   * will be assumed to be UTC and the moment will be in utc.
   * @private
   */
  private _decodeDateTimeAsIso(data: any) {
    let dateValue = data.value;
    if (
      this.serverInformation &&
      this.serverInformation.is_timezone_support_enabled
    ) {
      // Server responds with timezone naive strings, add Z to indicate UTC.
      // If the string somehow already contains a timezone offset, do not add Z.
      if (!dateValue.endsWith("Z") && !dateValue.includes("+")) {
        dateValue += "Z";
      }
      // Return date as moment object with UTC set to true.
      return new Date(dateValue).toISOString();
    }
    // Server has no timezone support, return date in ISO format
    return new Date(dateValue).toISOString();
  }

  /**
   * Decode datetime *data* into moment objects.
   *
   * Translate objects with __type__ equal to 'datetime' into moment
   * datetime objects. If time zone support is enabled on the server the date
   * will be assumed to be UTC and the moment will be in utc.
   * @private
   */
  private _decodeDateTimeAsMoment(data: any) {
    if (
      this.serverInformation &&
      this.serverInformation.is_timezone_support_enabled
    ) {
      // Return date as moment object with UTC set to true.
      return moment.utc(data.value);
    }

    // Return date as local moment object.
    return moment(data.value);
  }

  /**
   * Return new object where all values have been decoded.
   * @private
   */
  private _decodePlainObject(
    object: Data,
    identityMap: Data,
    decodeDatesAsIso: boolean
  ) {
    return Object.keys(object).reduce<Data>((previous, key) => {
      previous[key] = this.decode(object[key], identityMap, decodeDatesAsIso);
      return previous;
    }, {});
  }

  /**
   * Return new Array where all items have been decoded.
   * @private
   */
  private _decodeArray(
    collection: any[],
    identityMap: Data,
    decodeDatesAsIso: boolean
  ): any[] {
    return collection.map((item) =>
      this.decode(item, identityMap, decodeDatesAsIso)
    );
  }

  /**
   * Return merged *entity* using *identityMap*.
   * @private
   */
  private _mergeEntity(
    entity: Data,
    identityMap: Data,
    decodeDatesAsIso: boolean
  ) {
    const identifier = this.getIdentifyingKey(entity);
    if (!identifier) {
      logger.warn("Identifier could not be determined for: ", identifier);
      return entity;
    }

    if (!identityMap[identifier]) {
      identityMap[identifier] = {};
    }

    // Retrieve entity from identity map. Any instances which occur multiple
    // times in the encoded data will point to the same JavaScript object.
    // This means that output is not guaranteed to be JSON-serializable.
    //
    // TODO: Should we duplicate the information between the instances
    // instead of pointing them to the same instance?
    const mergedEntity = identityMap[identifier];

    for (const key in entity) {
      if (entity.hasOwnProperty(key)) {
        mergedEntity[key] = this.decode(
          entity[key],
          identityMap,
          decodeDatesAsIso
        );
      }
    }
    return mergedEntity;
  }

  /** Return encoded *operations*. */
  encodeOperations(operations: operation.Operation[]) {
    return JSON.stringify(this.encode(operations));
  }

  /**
   * Call API with array of operation objects in *operations*.
   *
   * Returns promise which will be resolved with an array of decoded
   * responses.
   *
   * The return promise may be rejected with one of several errors:
   *
   * ServerValidationError
   *     Validation errors
   * ServerPermissionDeniedError
   *     Permission defined errors
   * ServerError
   *     Generic server errors or network issues
   *
   * @typeParam T - Either an array of response types to get return type `Tuple<T[0], ..., T[n]>`, or a single response type to get return type T[]. Default is ActionResponse.
   * @param {Array} operations - API operations.
   * @param {Object} options
   * @param {AbortController} options.abortController - Abort controller, deprecated in favor of options.signal
   * @param {AbortSignal} options.signal - Abort signal
   * @param {string} options.pushToken - push token to associate with the request
   * @param {object} options.headers - Additional headers to send with the request
   * @param {string} options.decodeDatesAsIso - Return dates as ISO strings instead of moment objects
   *
   */
  async call<T = ActionResponse>(
    operations: operation.Operation[],
    {
      abortController,
      pushToken,
      signal,
      additionalHeaders = {},
      decodeDatesAsIso = false,
    }: CallOptions = {}
  ): Promise<IsTuple<T> extends true ? T : T[]> {
    await this.initializing;
    const url = `${this.serverUrl}${this.apiEndpoint}`;

    try {
      // Delay call until session is initialized if initialization is in
      // progress.

      let fetchResponse;
      try {
        fetchResponse = await fetch(url, {
          method: "post",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "ftrack-api-key": this.apiKey,
            "ftrack-user": this.apiUser,
            "ftrack-Clienttoken": this.clientToken,
            "ftrack-pushtoken": pushToken,
            ...this.additionalHeaders,
            ...additionalHeaders,
          } as HeadersInit,
          body: this.encodeOperations(operations),
          signal: abortController ? abortController.signal : signal,
        });
      } catch (reason) {
        if (reason instanceof Error) {
          throw this.getErrorFromResponse({
            exception: "NetworkError",
            content: reason.message,
          });
        }
        throw new Error("Unknown error");
      }

      const response = await fetchResponse.json();

      if (response.exception) {
        throw this.getErrorFromResponse(response);
      }

      return this.decode(response, {}, decodeDatesAsIso);
    } catch (reason) {
      logger.warn("Failed to perform request. ", reason);

      if (reason instanceof Error) {
        if (reason.name === "AbortError") {
          throw this.getErrorFromResponse({
            exception: "AbortError",
            content: reason.message,
          });
        }

        logger.warn("Server reported error in unexpected format. ", reason);
        throw this.getErrorFromResponse({
          exception: "MalformedResponseError",
          content: reason.message,
          error: reason,
        });
      }
    }

    throw new Error("Unknown error");
  }

  /**
   * Return promise of *entityType* with *data*, create or update if necessary.
   *
   *   *data* should be a dictionary of the same form passed to `create`
   *   method.
   *
   *   By default, check for an entity that has matching *data*. If
   *   *identifyingKeys* is specified as a list of keys then only consider the
   *   values from *data* for those keys when searching for existing entity.
   *
   *   If no *identifyingKeys* specified then use all of the keys from the
   *   passed *data*.
   *
   *   Raise an Error if no *identifyingKeys* can be determined.
   *
   *   If no matching entity found then create entity using supplied *data*.
   *
   *   If a matching entity is found, then update it if necessary with *data*.
   *
   *   Return update or create promise.
   */

  ensure<T extends Data = Data>(
    entityType: string,
    data: T,
    identifyingKeys: Array<keyof T> = []
  ): Promise<T> {
    let keys = identifyingKeys as string[];

    logger.info(
      "Ensuring entity with data using identifying keys: ",
      entityType,
      data,
      keys
    );

    if (!keys.length) {
      keys = Object.keys(data);
    }

    if (!keys.length) {
      throw new Error(
        "Could not determine any identifying data to check against " +
          `when ensuring ${entityType} with data ${data}. ` +
          `Identifying keys: ${identifyingKeys}`
      );
    }

    const primaryKeys = this.getPrimaryKeyAttributes(entityType);
    if (primaryKeys === null || primaryKeys.length === 0) {
      throw new Error(`Primary key could not be found for: ${entityType}`);
    }
    let expression = `select ${primaryKeys.join(
      ", "
    )} from ${entityType} where`;
    const criteria = keys.map((identifyingKey) => {
      let value = data[identifyingKey];

      if (value != null && typeof value.valueOf() === "string") {
        value = `"${value}"`;
      } else if (convertToIsoString(value)) {
        value = convertToIsoString(value);
        value = `"${value}"`;
      }
      return `${identifyingKey} is ${value}`;
    });

    expression = `${expression} ${criteria.join(" and ")}`;

    return this.query<T>(expression).then((response) => {
      if (response.data.length === 0) {
        return this.create<T>(entityType, data).then(({ data: responseData }) =>
          Promise.resolve(responseData)
        );
      }

      if (response.data.length !== 1) {
        throw new Error(
          "Expected single or no item to be found but got multiple " +
            `when ensuring ${entityType} with data ${data}. ` +
            `Identifying keys: ${identifyingKeys}`
        );
      }

      const updateEntity = response.data[0];

      // Update entity if required.
      let updated = false;
      Object.keys(data).forEach((key: keyof T) => {
        if (data[key] !== updateEntity[key]) {
          updateEntity[key] = data[key];
          updated = true;
        }
      });

      if (updated) {
        return this.update<T>(
          entityType,
          primaryKeys.map((key: string) => updateEntity[key]),
          Object.keys(data).reduce<T>((accumulator, key: keyof T) => {
            if (primaryKeys.indexOf(key.toString()) === -1) {
              accumulator[key] = data[key];
            }
            return accumulator;
          }, {} as T)
        ).then(({ data: responseData }) => Promise.resolve(responseData));
      }

      return Promise.resolve(response.data[0]);
    });
  }

  /**
   * Return schema with id or null if not existing.
   * @param  {string} schemaId Id of schema model, e.g. `AssetVersion`.
   * @return {Object|null} Schema definition
   */
  getSchema(schemaId: string): Schema | null {
    const schema = this.schemas?.find((s) => s.id === schemaId);
    return schema ?? null;
  }

  /**
   * Perform a single query operation with *expression*.
   *
   * @param {string} expression - API query expression.
   * @param {object} options
   * @param {object} options.abortController - Deprecated in favour of options.signal
   * @param {object} options.signal - Abort signal user for aborting requests prematurely
   * @param {object} options.headers - Additional headers to send with the request
   * @param {object} options.decodeDatesAsIso - Decode dates as ISO strings instead of moment objects
   * @return {Promise} Promise which will be resolved with an object
   * containing action, data and metadata
   */
  async query<T extends Data = Data>(
    expression: string,
    options: QueryOptions = {}
  ) {
    logger.debug("Query", expression);
    const responses = await this.call<[QueryResponse<T>]>(
      [operation.query(expression)],
      options
    );
    return responses[0];
  }

  /**
   * Perform a single search operation with *expression*.
   *
   * @param {Object}   options
   * @param {String}   options.expression     API query expression
   * @param {String}   options.entityType     Entity type to search for
   * @param {String[]} options.terms          Search terms
   * @param {String}   [options.contextId]    Context id to limit the search result to
   * @param {String[]} [options.objectTypeIds] Object type ids to limit the search result to
   * @param {object} additionalOptions
   * @param {object} options.abortController - Deprecated in favour of options.signal
   * @param {object} options.signal - Abort signal user for aborting requests prematurely
   * @param {object} options.headers - Additional headers to send with the request
   * @param {object} options.decodeDatesAsIso - Decode dates as ISO strings instead of moment objects
   * @return {Promise} Promise which will be resolved with an object
   * containing data and metadata
   */
  async search<T extends Data = Data>(
    {
      expression,
      entityType,
      terms = [],
      contextId,
      objectTypeIds,
    }: SearchOptions,
    options: QueryOptions = {}
  ) {
    logger.debug("Search", {
      expression,
      entityType,
      terms,
      contextId,
      objectTypeIds,
    });

    const responses = await this.call<[SearchResponse<T>]>(
      [
        operation.search({
          expression,
          entityType,
          terms,
          contextId,
          objectTypeIds,
        }),
      ],
      options
    );
    return responses[0];
  }

  /**
   * Perform a single create operation with *type* and *data*.
   *
   * @param {string} entityType entity type name.
   * @param {Object} data data which should be used to populate attributes on the entity.
   * @param {Object} options
   * @param {string} options.pushToken - push token to associate with the request
   * @param {object} options.headers - Additional headers to send with the request
   * @param {object} options.decodeDatesAsIso - Decode dates as ISO strings instead of moment objects
   * @return {Promise} Promise which will be resolved with the response.
   */
  async create<T extends Data = Data>(
    entityType: string,
    data: T,
    options: MutationOptions = {}
  ) {
    logger.debug("Create", entityType, data, options);

    const responses = await this.call<[CreateResponse<T>]>(
      [operation.create(entityType, data)],
      options
    );
    return responses[0];
  }

  /**
   * Perform a single update operation on *type* with *keys* and *data*.
   *
   * @param  {string} type Entity type
   * @param  {Array} keys Identifying keys, typically [<entity id>]
   * @param  {Object} data
   * @param {Object} options
   * @param {string} options.pushToken - push token to associate with the request
   * @param {object} options.headers - Additional headers to send with the request
   * @param {object} options.decodeDatesAsIso - Decode dates as ISO strings instead of moment objects
   * @return {Promise} Promise resolved with the response.
   */
  async update<T extends Data = Data>(
    type: string,
    keys: string[],
    data: T,
    options: MutationOptions = {}
  ) {
    logger.debug("Update", type, keys, data, options);

    const responses = await this.call<[UpdateResponse<T>]>(
      [operation.update(type, keys, data)],
      options
    );
    return responses[0];
  }

  /**
   * Perform a single delete operation.
   *
   * @param  {string} type Entity type
   * @param  {Array} keys Identifying keys, typically [<entity id>]
   * @param {Object} options
   * @param {string} options.pushToken - push token to associate with the request
   * @param {object} options.headers - Additional headers to send with the request
   * @param {object} options.decodeDatesAsIso - Decode dates as ISO strings instead of moment objects
   * @return {Promise} Promise resolved with the response.
   */
  async delete(type: string, keys: string[], options: MutationOptions = {}) {
    logger.debug("Delete", type, keys, options);

    const responses = await this.call<[DeleteResponse]>(
      [operation.delete(type, keys)],
      options
    );

    return responses[0];
  }

  /**
   * Return an URL where *componentId* can be downloaded.
   *
   * @param {?string} componentId Is assumed to be present in the
   *                  ftrack.server location.
   * @return {String|null} URL where *componentId* can be downloaded, null
   *                       if component id is not specified.
   */
  getComponentUrl(componentId: string) {
    if (!componentId) {
      return null;
    }

    const params = {
      id: componentId,
      username: this.apiUser,
      apiKey: this.apiKey,
    };

    return `${this.serverUrl}/component/get?${new URLSearchParams(
      params
    ).toString()}`;
  }

  /**
   * Return an URL where a thumbnail for *componentId* can be downloaded.
   *
   * @param {?string} componentId - Is assumed to be present in the
   *                  ftrack.server location and be of a valid image file type.
   * @param {?object} [options = {}] - Options
   * @param {?number} options.size - The size of the thumbnail. The image will be resized to
   *                  fit within size x size pixels. Defaults to 300.
   * @return {string} URL where *componentId* can be downloaded. Returns the
   *                  URL to a default thumbnail if component id is not
   *                  specified.
   */
  thumbnailUrl(componentId: string, { size = 300 } = {}) {
    if (!componentId) {
      return `${this.serverUrl}/img/thumbnail2.png`;
    }

    const params = {
      id: componentId,
      size: String(size),
      username: this.apiUser,
      apiKey: this.apiKey,
    };

    return `${this.serverUrl}/component/thumbnail?${new URLSearchParams(
      params
    ).toString()}`;
  }

  /**
   * Create component from *file* and add to server location.
   *
   * @param  {Blob} - The file object to upload.
   * @param {?object} [options = {}] - Options
   * @param {?string} options.name - Component name. Defaults get from file object.
   * @param {?number} options.data - Component data. Defaults to {}.
   * @return {Promise} Promise resolved with the response when creating
   * Component and ComponentLocation.
   */
  createComponent<T extends Data = Data>(
    file: Blob,
    options: CreateComponentOptions = {}
  ): Promise<
    [CreateResponse<T>, CreateResponse<T>, GetUploadMetadataResponse]
  > {
    const componentName = options.name ?? (file as File).name;

    let normalizedFileName;
    if (componentName) {
      normalizedFileName = normalizeString(componentName);
    }

    if (!normalizedFileName) {
      throw new CreateComponentError("Component name is missing.");
    }
    const fileNameParts = splitFileExtension(normalizedFileName);
    const defaultProgress = (progress: number) => progress;
    const defaultAbort = () => {};

    const data = options.data || {};
    const onProgress = options.onProgress || defaultProgress;
    const xhr = options.xhr || new XMLHttpRequest();
    const onAborted = options.onAborted || defaultAbort;

    const fileType = data.file_type || fileNameParts[1];
    const fileName = data.name || fileNameParts[0];
    const fileSize = data.size || file.size;
    const componentId = data.id || uuidV4();
    const componentLocationId = uuidV4();
    let url: string;
    let headers: Record<string, string> = {};

    const updateOnProgressCallback = (
      oEvent: ProgressEvent<XMLHttpRequestEventTarget>
    ) => {
      let progress = 0;

      if (oEvent.lengthComputable) {
        progress = Math.floor((oEvent.loaded / oEvent.total) * 100);
      }

      onProgress(progress);
    };

    logger.debug("Registering component and fetching upload metadata.");

    const component = Object.assign(data, {
      id: componentId,
      name: fileName,
      file_type: fileType,
      size: fileSize,
    });
    const componentLocation = {
      id: componentLocationId,
      component_id: componentId,
      resource_identifier: componentId,
      location_id: SERVER_LOCATION_ID,
    };

    const componentAndLocationPromise = this.call<
      [CreateResponse<T>, CreateResponse<T>, GetUploadMetadataResponse]
    >([
      operation.create("FileComponent", component),
      operation.create("ComponentLocation", componentLocation),
      {
        action: "get_upload_metadata",
        file_name: `${fileName}${fileType}`,
        file_size: fileSize,
        component_id: componentId,
      },
    ]).then((response) => {
      url = response[2].url;
      headers = response[2].headers;
      return response;
    });

    return componentAndLocationPromise.then(() => {
      logger.debug(`Uploading file to: ${url}`);

      return new Promise((resolve, reject) => {
        // wait until file is uploaded
        xhr.upload.addEventListener("progress", updateOnProgressCallback);
        xhr.open("PUT", url, true);
        xhr.onabort = () => {
          onAborted();
          this.delete("FileComponent", [componentId]).then(() => {
            reject(
              new CreateComponentError(
                "Upload aborted by client",
                "UPLOAD_ABORTED"
              )
            );
          });
        };

        for (const key in headers) {
          if (headers.hasOwnProperty(key) && key !== "Content-Length") {
            xhr.setRequestHeader(key, headers[key]);
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 400) {
            reject(
              new CreateComponentError(`Failed to upload file: ${xhr.status}`)
            );
          }
          resolve(xhr.response);
        };
        xhr.onerror = () => {
          this.delete("FileComponent", [componentId]).then(() => {
            reject(
              new CreateComponentError(`Failed to upload file: ${xhr.status}`)
            );
          });
        };
        xhr.send(file);
      }).then(() => componentAndLocationPromise);
    });
  }
}
