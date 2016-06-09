// :copyright: Copyright (c) 2016 ftrack

import forIn from 'lodash/forIn';
import moment from 'moment';
import loglevel from 'loglevel';

import { EventHub } from './event';
import { queryOperation, createOperation, updateOperation, deleteOperation } from './operation';
import { ServerPermissionDeniedError, ServerValidationError, ServerError } from './error';


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
 * ftrack API session
 */
export class Session {

    /** Construct Session instance with API credentials. */
    constructor(
        serverUrl, apiUser, apiKey, {
            autoConnectEventHub = false,
            eventHubOptions = {},
        } = {}
    ) {
        if (!serverUrl || !apiUser || !apiKey) {
            throw new Error(
                'Invalid arguments, please construct Session with ' +
                '*serverUrl*, *apiUser* and *apiKey*.'
            );
        }

        this.apiUser = apiUser;
        this.apiKey = apiKey;
        this.serverUrl = serverUrl;
        this.eventHub = new EventHub(serverUrl, apiUser, apiKey, eventHubOptions);

        if (autoConnectEventHub) {
            this.eventHub.connect();
        }

        const operations = [
            { action: 'query_server_information' },
            { action: 'query_schemas' },
        ];
        this.initialized = false;
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

    /** Iterate *data* and decode entities with special encoding logic.
    *
    * This will translate objects with __type__ equal to 'datetime' into moment
    * datetime objects. If time zone support is enabled on the server the date
    * will be assumed to be UTC and cast into the local time zone.
    *
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

    /** Return merged lazy loaded entities in *data*. */
    merge(data) {
        return this._mergeCollection(data, {});
    }

    /** Return merged *collection* of entities using *identityMap*. */
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

    /** Return merged *entity* using *identityMap*. */
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
     * ServerValidationError - Validation errors
     * ServerPermissionDeniedError - Permission defined errors
     * ServerError - Generic server errors or network issues
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

    /** Return schema with id or null if not existing. */
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
     * Returns a promise which will be resolved with an object containing data
     * and metadata.
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
     * Returns a promise which will be resolved with the new object data.
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
     * Perform a single update operation on *type* with *id* and *data*.
     *
     * Returns a promise which will be resolved with the updated data.
     */
    update(type, id, data) {
        logger.debug('Update', type, id, data);

        let request = this.call([updateOperation(type, id, data)]);
        request = request.then((responses) => {
            const response = responses[0];
            return response;
        });

        return request;
    }

    /**
     * Perform a single delete operation on *type* with *id*.
     *
     * Returns a promise.
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
     * *componentId* is assumed to be present in the ftrack.server location.
     * Returns null if component id is not specified.
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
     * *componentId* is assumed to be present in the ftrack.server location
     * and be of a valid image file type.
     *
     * The image will be resized to fit within size x size pixels.
     *
     * Returns the URL to a default thumbnail if component id is not specified.
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
}

export default Session;
