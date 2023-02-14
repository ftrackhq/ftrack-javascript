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
import { Data } from "./types";

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

export interface EventHubOptions {
  applicationId?: string;
}

export interface SessionOptions {
  autoConnectEventHub?: boolean;
  serverInformationValues?: string[];
  eventHubOptions?: EventHubOptions;
  clientToken?: string;
  apiEndpoint?: string;
}

export interface CreateComponentOptions {
  name?: string;
  data?: Data;
  onProgress?: (progress: number) => unknown;
  xhr?: XMLHttpRequest;
  onAborted?: () => unknown;
}

export interface Entity {
  id: string;
  __entity_type__: string;
}

export interface SearchOptions {
  expression: string;
  entityType: string;
  terms?: string[];
  contextId?: string;
  objectTypeIds?: string[];
}

export interface Response<T> {
  url?: any;
  headers?: any;
  action: string;
  metadata: {
    next: {
      offset: number | null;
    };
  };
  data: T[];
}

export interface ResponseError {
  exception: string;
  content: string;
  error_code?: string;
  error?: Data;
}

export interface MutatationOptions {
  pushToken?: string;
}

export interface QueryOptions {
  abortController?: AbortController;
  signal?: AbortSignal;
}

export interface CallOptions extends MutatationOptions, QueryOptions {}

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
  schemas?: Data;
  serverVersion?: string;

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
    this.initializing = this.call(operations).then((responses) => {
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
  getPrimaryKeyAttributes(entityType: string) {
    if (!this.schemas) {
      logger.warn("Schemas not available.");
      return null;
    }
    const schema = this.schemas.find((item: any) => item.id === entityType);
    if (!schema || !schema.primary_key) {
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
   * This will translate objects with type moment into string representation.
   * If time zone support is enabled on the server the date
   * will be sent as UTC, otherwise in local time.
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

    if (data && data._isAMomentObject) {
      // Ensure that the moment object is in UTC and format
      // to timezone naive string.
      return {
        __type__: "datetime",
        value: data.utc().format(ENCODE_DATETIME_FORMAT),
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

  private decode(data: any, identityMap: Data = {}): any {
    if (Array.isArray(data)) {
      return this._decodeArray(data, identityMap);
    }
    if (typeof data === "object" && data?.constructor === Object) {
      if (data.__entity_type__) {
        return this._mergeEntity(data, identityMap);
      }
      if (data.__type__ === "datetime") {
        return this._decodeDateTime(data);
      }
      return this._decodePlainObject(data, identityMap);
    }
    return data;
  }

  /**
   * Decode datetime *data* into moment objects.
   *
   * Translate objects with __type__ equal to 'datetime' into moment
   * datetime objects. If time zone support is enabled on the server the date
   * will be assumed to be UTC and the moment will be in utc.
   * @private
   */
  private _decodeDateTime(data: any) {
    // Return date as moment object with UTC set to true.
    return moment.utc(data.value);
  }

  /**
   * Return new object where all values have been decoded.
   * @private
   */
  private _decodePlainObject(object: Data, identityMap: Data) {
    return Object.keys(object).reduce<Data>((previous, key) => {
      previous[key] = this.decode(object[key], identityMap);
      return previous;
    }, {});
  }

  /**
   * Return new Array where all items have been decoded.
   * @private
   */
  private _decodeArray(collection: any[], identityMap: Data): any[] {
    return collection.map((item) => this.decode(item, identityMap));
  }

  /**
   * Return merged *entity* using *identityMap*.
   * @private
   */
  private _mergeEntity(entity: Data, identityMap: Data) {
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
        mergedEntity[key] = this.decode(entity[key], identityMap);
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
   * @param {Array} operations - API operations.
   * @param {Object} options
   * @param {AbortController} options.abortController - Abort controller, deprecated in favor of options.signal
   * @param {AbortSignal} options.signal - Abort signal
   * @param {string} options.pushToken - push token to associate with the request
   *
   */
  call(
    operations: operation.Operation[],
    { abortController, pushToken, signal }: CallOptions = {}
  ): Promise<Response<Data>[]> {
    const url = `${this.serverUrl}${this.apiEndpoint}`;

    // Delay call until session is initialized if initialization is in
    // progress.
    let request = new Promise<void>((resolve) => {
      if (this.initializing && !this.initialized) {
        this.initializing.then(() => {
          resolve();
        });
      } else {
        resolve();
      }
    })
      .then(() =>
        fetch(url, {
          method: "post",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "ftrack-api-key": this.apiKey,
            "ftrack-user": this.apiUser,
            "ftrack-Clienttoken": this.clientToken,
            "ftrack-pushtoken": pushToken,
          } as HeadersInit,
          body: this.encodeOperations(operations),
          signal: abortController ? abortController.signal : signal,
        })
      )
      .catch((reason) => {
        logger.warn("Failed to perform request. ", reason);
        if (reason.name === "AbortError") {
          return Promise.resolve<ResponseError>({
            exception: "AbortError",
            content: reason.message,
          });
        }
        return Promise.resolve<ResponseError>({
          exception: "NetworkError",
          content: reason.message,
        });
      })
      .then((response) => {
        if ("json" in response) {
          return (response.json && response.json()) || response;
        }
        return response;
      })
      .then((data) => {
        if (this.initialized) {
          return this.decode(data);
        }

        return data;
      })
      // Catch badly formatted responses
      .catch((reason) => {
        logger.warn("Server reported error in unexpected format. ", reason);
        return Promise.resolve<ResponseError>({
          exception: "MalformedResponseError",
          content: reason.message,
          error: reason,
        });
      })
      // Reject promise on API exception.
      .then((response) => {
        if (response.exception) {
          return Promise.reject<ResponseError>(
            this.getErrorFromResponse(response as ResponseError)
          );
        }
        return Promise.resolve(response);
      });

    return request;
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
  ensure(
    entityType: string,
    data: Data,
    identifyingKeys: string[] = []
  ): Promise<Data> {
    let keys = identifyingKeys;

    logger.info(
      "Ensuring entity with data using identifying keys: ",
      entityType,
      data,
      identifyingKeys
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
    let expression = `select ${primaryKeys.join(
      ", "
    )} from ${entityType} where`;
    const criteria = keys.map((identifyingKey) => {
      let value = data[identifyingKey];

      if (value != null && typeof value.valueOf() === "string") {
        value = `"${value}"`;
      } else if (value && value._isAMomentObject) {
        // Server does not store microsecond or timezone currently so
        // need to strip from query.
        value = moment(value).utc().format(ENCODE_DATETIME_FORMAT);
        value = `"${value}"`;
      }
      return `${identifyingKey} is ${value}`;
    });

    expression = `${expression} ${criteria.join(" and ")}`;

    return this.query(expression).then((response) => {
      if (response.data.length === 0) {
        return this.create(entityType, data).then(({ data: responseData }) =>
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
      Object.keys(data).forEach((key) => {
        if (data[key] !== updateEntity[key]) {
          updateEntity[key] = data[key];
          updated = true;
        }
      });

      if (updated) {
        return this.update(
          entityType,
          primaryKeys.map((key: string) => updateEntity[key]),
          Object.keys(data).reduce<Data>((accumulator, key) => {
            if (primaryKeys.indexOf(key) === -1) {
              accumulator[key] = data[key];
            }
            return accumulator;
          }, {})
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
  getSchema(schemaId: string): Data | null {
    for (const index in this.schemas) {
      if (this.schemas[index].id === schemaId) {
        return this.schemas[index];
      }
    }

    return null;
  }

  /**
   * Perform a single query operation with *expression*.
   *
   * @param {string} expression - API query expression.
   * @param {object} options
   * @param {object} options.abortController - Deprecated in favour of options.signal
   * @param {object} options.signal - Abort signal user for aborting requests prematurely
   * @return {Promise} Promise which will be resolved with an object
   * containing action, data and metadata
   */
  query(expression: string, options: QueryOptions = {}) {
    logger.debug("Query", expression);

    const queryOperation = operation.query(expression);
    let request = this.call([queryOperation], options).then((responses) => {
      const response = responses[0];
      return response;
    });

    return request;
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
   * @return {Promise} Promise which will be resolved with an object
   * containing data and metadata
   */
  search(
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

    const searchOperation = operation.search({
      expression,
      entityType,
      terms,
      contextId,
      objectTypeIds,
    });
    let request = this.call([searchOperation], options).then((responses) => {
      const response = responses[0];
      return response;
    });

    return request;
  }

  /**
   * Perform a single create operation with *type* and *data*.
   *
   * @param {string} entityType entity type name.
   * @param {Object} data data which should be used to populate attributes on the entity.
   * @param {Object} options
   * @param {string} options.pushToken - push token to associate with the request
   * @return {Promise} Promise which will be resolved with the response.
   */
  create(entityType: string, data: Data, { pushToken }: CallOptions = {}) {
    logger.debug("Create", entityType, data, pushToken);

    let request = this.call([operation.create(entityType, data)], {
      pushToken,
    }).then((responses) => {
      const response = responses[0];
      return response;
    });

    return request;
  }

  /**
   * Perform a single update operation on *type* with *keys* and *data*.
   *
   * @param  {string} type Entity type
   * @param  {Array} keys Identifying keys, typically [<entity id>]
   * @param  {Object} data
   * @param {Object} options
   * @param {string} options.pushToken - push token to associate with the request
   * @return {Promise} Promise resolved with the response.
   */
  update(
    type: string,
    keys: string[],
    data: Data,
    { pushToken }: MutatationOptions = {}
  ) {
    logger.debug("Update", type, keys, data, pushToken);

    const request = this.call([operation.update(type, keys, data)], {
      pushToken,
    }).then((responses) => {
      const response = responses[0];
      return response;
    });

    return request;
  }

  /**
   * Perform a single delete operation.
   *
   * @param  {string} type Entity type
   * @param  {Array} keys Identifying keys, typically [<entity id>]
   * @param {Object} options
   * @param {string} options.pushToken - push token to associate with the request
   * @return {Promise} Promise resolved with the response.
   */
  delete(type: string, keys: string[], { pushToken }: MutatationOptions = {}) {
    logger.debug("Delete", type, keys, pushToken);

    let request = this.call([operation.delete(type, keys)], { pushToken }).then(
      (responses) => {
        const response = responses[0];
        return response;
      }
    );

    return request;
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
  createComponent(
    file: Blob,
    options: CreateComponentOptions = {}
  ): Promise<Response<Data>[]> {
    const normalizedFileName = normalizeString(
      options.name ?? (file instanceof File ? file.name : "component")
    );
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

    const componentAndLocationPromise = this.call([
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
