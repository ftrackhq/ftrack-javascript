// :copyright: Copyright (c) 2016 ftrack

import forIn from 'lodash/forIn';
import moment from 'moment';
import loglevel from 'loglevel';
import uuid from 'uuid';

import EventHub from './event_hub';
import { queryOperation, createOperation, updateOperation, deleteOperation } from './operation';
import { ServerPermissionDeniedError, ServerValidationError, ServerError } from './error';
import { SERVER_LOCATION_ID } from './constant';


const logger = loglevel.getLogger('ftrack_api');

// A list of combined primary keys. If a entity type does not exist in this map
// the primary key will be assumed to be id.
const COMBINED_PRIMARY_KEY_MAP = {
    NoteComponent: ['note_id', 'component_id'],
    Metadata: ['parent_id', 'key'],
    SchemaStatus: ['status_id', 'schema_id'],
};

/* Return the identity of *item*. */
function identity(item) {
    if (COMBINED_PRIMARY_KEY_MAP[item.__entity_type__]) {
        const combinedKey = COMBINED_PRIMARY_KEY_MAP[item.__entity_type__].map(
            key => item[key]
        );
        return combinedKey.join(',');
    }

    return item.id;
}

/**
 * Create component from *file* and add to server location.
 *
 * @param  {fileName} The name of the file.
 * @return {array} Array with [basename, extension] from filename.
 */
function splitFileExtension(fileName) {
    let basename = fileName || '';
    let extension = fileName.slice(
        (
            Math.max(
                0, fileName.lastIndexOf('.')
            ) || Infinity
        ) + 1
    ) || '';

    if (extension.length) {
        extension = `.${extension}`;
        basename = fileName.slice(0, -1 * extension.length) || '';
    }

    return [basename, extension];
}

/**
 * ftrack API session
 * @class  Session
 *
 */
export class Session {

    /**
     * Construct Session instance with API credentials.
     *
     * @param  {string}  serverUrl -                  ftrack server URL
     * @param  {string}  apiUser -                    ftrack username for API user.
     * @param  {string}  apiKey -                     User API Key
     * @param  {Object}  options  -                   options
     * @param  {Boolean} [options.autoConnectEventHub=false] - Automatically connect to event hub,
     * @param  {Object}  [options.eventHubOptions={}] - Options to configure event hub with.
     *
     * @constructs Session
     */
    constructor(
        serverUrl, apiUser, apiKey, {
            autoConnectEventHub = false,
            eventHubOptions = {},
            clientToken = null,
        } = {}
    ) {
        if (!serverUrl || !apiUser || !apiKey) {
            throw new Error(
                'Invalid arguments, please construct Session with ' +
                '*serverUrl*, *apiUser* and *apiKey*.'
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
            this.clientToken = `ftrack-javascript-api--${uuid.v4()}`;
        }

        const operations = [
            { action: 'query_server_information' },
            { action: 'query_schemas' },
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
        this.initializing = this.call(operations).then(
            (responses) => {
                this.serverInformation = responses[0];
                this.schemas = responses[1];
                this.serverVersion = this.serverInformation.version;
                this.initialized = true;

                return Promise.resolve(this);
            }
        );
    }

   /**
    * Iterate *data* and decode entities with special encoding logic.
    *
    * This will translate objects with __type__ equal to 'datetime' into moment
    * datetime objects. If time zone support is enabled on the server the date
    * will be assumed to be UTC and cast into the local time zone.
    *
    * @private
    * @param  {*} data  The data to decode.
    * @return {*}      Decoded data
    */
    decode(data) {
        if (data && data.constructor === Array) {
            return data.map(item => this.decode(item));
        }

        if (data && data.constructor === Object) {
            if (data.__type__ === 'datetime') {
                let adjustedMoment;
                if (
                    this.serverInformation &&
                    this.serverInformation.is_timezone_support_enabled
                ) {
                    adjustedMoment = moment.utc(data.value);
                } else {
                    adjustedMoment = moment(data.value);
                }
                adjustedMoment.local();
                return adjustedMoment;
            }

            const out = {};
            forIn(data, (value, key) => {
                out[key] = this.decode(value);
            });

            return out;
        }

        return data;
    }

    /**
     * Return merged lazy loaded entities in *data*.
     *
     * @private
     */
    merge(data) {
        return this._mergeCollection(data, {});
    }

    /**
     * Return merged *collection* of entities using *identityMap*.
     * @private
     */
    _mergeCollection(collection, identityMap) {
        const mergedCollection = collection.map(
            (item) => {
                if (!item.__entity_type__) {
                    // Only process API entity types.
                    return item;
                }

                return this._mergeEntity(item, identityMap);
            }
        );

        return mergedCollection;
    }

    /**
     * Return merged *entity* using *identityMap*.
     * @private
     */
    _mergeEntity(entity, identityMap) {
        const primaryKey = identity(entity);

        if (!primaryKey) {
            // This happens for combined primary keys if the do not exist
            // in COMBINED_PRIMARY_KEY_MAP.
            logger.warn('Key could not be determined for: ', entity);
            return entity;
        }

        const identifier = `${primaryKey},${entity.__entity_type__}`;
        if (!identityMap[identifier]) {
            identityMap[identifier] = {};
        }

        const mergedEntity = identityMap[identifier];

        forIn(
            entity,
            (value, key) => {
                if (value && value.constructor === Array) {
                    mergedEntity[key] = this._mergeCollection(
                        value, identityMap
                    );
                } else if (value && value.constructor === Object) {
                    mergedEntity[key] = this._mergeEntity(value, identityMap);
                } else {
                    mergedEntity[key] = value;
                }
            }
        );

        return mergedEntity;
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
     *
     */
    call(operations) {
        const url = `${this.serverUrl}/api`;

        // Delay call until session is initialized if initialization is in
        // progress.
        let request = new Promise((resolve) => {
            if (this.initializing && !this.initialized) {
                this.initializing.then(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });

        request = request.then(() =>
            fetch(url, {
                method: 'post',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'ftrack-api-key': this.apiKey,
                    'ftrack-user': this.apiUser,
                    'ftrack-Clienttoken': this.clientToken,
                },
                body: JSON.stringify(operations),
            })
        );

        // Catch network errors
        request = request.catch((reason) => {
            logger.warn('Failed to perform request. ', reason);
            return Promise.resolve({
                exception: 'NetworkError',
                content: reason.message,
            });
        });

        request = request.then(
            (response) => response.json && response.json() || response
        );

        request = request.then((data) => {
            const result = this.decode(data);
            return Promise.resolve(result);
        });

        // Catch badly formatted responses
        request = request.catch((reason) => {
            logger.warn('Server reported error in unexpected format. ', reason);
            return Promise.resolve({
                exception: 'MalformedResponseError',
                content: reason.message,
                error: reason,
            });
        });

        // Reject promise on API exception.
        request = request.then((response) => {
            if (response.exception) {
                const message = `${response.exception}: ${response.content}`;
                let error;

                if (response.exception === 'ValidationError') {
                    error = new ServerValidationError(message);
                } else if (response.exception === 'FTAuthenticationError') {
                    error = new ServerPermissionDeniedError(message);
                } else {
                    error = new ServerError(message);
                }

                return Promise.reject(error);
            }
            return Promise.resolve(response);
        });

        return request;
    }

    /**
     * Return schema with id or null if not existing.
     * @param  {string} schemaId Id of schema model, e.g. `AssetVersion`.
     * @return {Object|null} Schema definition
     */
    getSchema(schemaId) {
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
     * @return {Promise} Promise which will be resolved with an object
     * containing data and metadata
     */
    query(expression) {
        logger.debug('Query', expression);

        const operation = queryOperation(expression);
        let request = this.call([operation]);
        request = request.then(
            (responses) => {
                const response = responses[0];
                response.data = this.merge(response.data);
                return response;
            }
        );

        return request;
    }

    /**
     * Perform a single create operation with *type* and *data*.
     *
     * @param {string} type entity type name.
     * @param {Object} data data which should be used to populate attributes on the entity.
     * @return {Promise} Promise which will be resolved with the response.
     */
    create(type, data) {
        logger.debug('Create', type, data);

        let request = this.call([createOperation(type, data)]);
        request = request.then((responses) => {
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
     * @return {Promise} Promise resolved with the response.
     */
    update(type, keys, data) {
        logger.debug('Update', type, keys, data);

        let request = this.call([updateOperation(type, keys, data)]);
        request = request.then((responses) => {
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
     * @return {Promise} Promise resolved with the response.
     */
    delete(type, id) {
        logger.debug('Delete', type, id);

        let request = this.call([deleteOperation(type, id)]);
        request = request.then((responses) => {
            const response = responses[0];
            return response;
        });

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
    getComponentUrl(componentId) {
        if (!componentId) {
            return null;
        }

        return (
            `${this.serverUrl}/component/get?id=${componentId}` +
            `&username=${this.apiUser}&apiKey=${this.apiKey}`
        );
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
    thumbnailUrl(componentId, { size = 300 } = {}) {
        if (!componentId) {
            return `${this.serverUrl}/img/thumbnail2.png`;
        }

        return (
            `${this.serverUrl}/component/thumbnail?id=${componentId}` +
            `&size=${size}&username=${this.apiUser}&apiKey=${this.apiKey}`
        );
    }

    /**
     * Create component from *file* and add to server location.
     *
     * @param  {File} The file object to upload.
     * @param {?object} [options = {}] - Options
     * @param {?number} options.data - Component data. Defaults to {}.
     * @return {Promise} Promise resolved with the response when creating
     * Component and ComponentLocation.
     */
    createComponent(file, { data = {} } = {}) {
        const fileNameParts = splitFileExtension(file.name);
        const fileType = data.file_type || fileNameParts[1];
        const fileName = data.name || fileNameParts[0];
        const fileSize = data.size || file.size;
        const componentId = data.id || uuid.v4();

        logger.debug('Fetching upload metadata.');
        let request = this.call([{
            action: 'get_upload_metadata',
            file_name: `${fileName}${fileType}`,
            file_size: fileSize,
            component_id: componentId,
        }]);

        request = request.then((response) => {
            logger.debug(`Uploading file to: ${response[0].url}`);

            return fetch(response[0].url, {
                method: 'put',
                headers: response[0].headers,
                body: file,
            });
        });

        request = request.then(() => {
            logger.debug('Creating component and component location.');
            const component = Object.assign(data, {
                id: componentId,
                name: fileName,
                file_type: fileType,
                size: fileSize,
            });
            const componentLocation = {
                component_id: componentId,
                resource_identifier: componentId,
                location_id: SERVER_LOCATION_ID,
            };

            return this.call(
                [
                    createOperation('FileComponent', component),
                    createOperation('ComponentLocation', componentLocation),
                ]
            );
        });

        return request;
    }

}

export default Session;
