// :copyright: Copyright (c) 2016 ftrack

import forIn from 'lodash/forIn';
import moment from 'moment';
import loglevel from 'loglevel';

import { EventHub } from './event';
import { queryOperation } from './operation';
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

/** Recursively iterate *data* and gather duplicates in *collection*.
*
* Note that *collection* is assumed to be a object and is updated in place. The
* result will be a dictionary with all entities mapped with their identity.
*
* .. example::
*
*       {
*           <primary-key>,Task: [<Task1>, <Task2>, <Task3>],
*           <primary-key>,Note: [<Note1>, <Note2>]
*       }
*
*       Where Task1, Task2 and Task3 is containing data for the same task.
*
*/
function _gatherEntityDuplicates(data, collection) {
    data.forEach(
        (item) => {
            if (!item.__entity_type__) {
                // Only process API entity types.
                return;
            }

            const primaryKey = identity(item);

            if (!primaryKey) {
                // This happens for combined primary keys if the do not exist
                // in COMBINED_PRIMARY_KEY_MAP.
                logger.warn('Key could not be determined for: ', item);
                return;
            }

            const identifier = `${primaryKey},${item.__entity_type__}`;

            forIn(
                item,
                (value) => {
                    if (value && value.constructor === Array) {
                        _gatherEntityDuplicates(value, collection);
                    }

                    if (value && value.constructor === Object) {
                        _gatherEntityDuplicates([value], collection);
                    }
                }
            );

            if (!collection[identifier]) {
                collection[identifier] = [];
            }

            collection[identifier].push(item);
        }
    );
}

/** Merge lazy loaded entities in *data*. */
function merge(data) {
    const collection = {};

    _gatherEntityDuplicates(data, collection);

    // Now merge all objects with the same identifier.
    forIn(collection, (objects) => {
        const map = {};
        forIn(objects, (item) => {
            forIn(item, (value, key) => {
                if (value && value.constructor !== Array && value.constructor !== Object) {
                    map[key] = value;
                }
            });
        });

        forIn(objects, (item) => {
            Object.assign(item, map);
        });
    });

    return data;
}


/**
 * ftrack API session
 */
export class Session {

    /** Construct Session instance with API credentials. */
    constructor(serverUrl, apiUser, apiKey, { autoConnectEventHub = false }) {
        this._apiUser = apiUser;
        this._apiKey = apiKey;
        this._serverUrl = serverUrl;
        this.initialized = false;
        this.eventHub = new EventHub(serverUrl, apiUser, apiKey);

        if (autoConnectEventHub) {
            this.eventHub.connect();
        }
    }

    /**
     * Initialize session
     * Returns promise which will be resolved once session is ready for use.
     */
    initialize() {
        const operations = [
            { action: 'query_server_information' },
            { action: 'query_schemas' },
        ];
        const request = this._call(operations);

        request.then(
            (responses) => {
                this._serverInformation = responses[0];
                this._schemas = responses[1];
                this.serverVersion = this._serverInformation.version;
                this.initialized = true;
            }
        );

        return request;
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
                    this._serverInformation &&
                    this._serverInformation.is_timezone_support_enabled
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
     * Call API with array of operation objects in *operations*.
     *
     * Returns promise which will be resolved with an array of decoded
     * responses.
     */
    _call(operations) {
        const url = `${this._serverUrl}/api`;

        let request = fetch(url, {
            method: 'post',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'ftrack-api-key': this._apiKey,
                'ftrack-user': this._apiUser,
            },
            body: JSON.stringify(operations),
        });

        request = request.then(
            (response) => response.json()
        );

        request = request.then((data) => {
            const result = this.decode(data);
            return Promise.resolve(result);
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
        for (const index in this._schemas) {
            if (this._schemas[index].id === schemaId) {
                return this._schemas[index];
            }
        }

        return null;
    }

    /** Return statuses from *projectSchemaId* for *schemaId* and *typeId*.
    *
    * *schemaId* should be a valid ftrack api schema, .e.g. 'AssetVersion' or
    * 'Task'.
    *
    * *typeId* can be used to get overridden statuses for a certain task type.
    *
    */
    getStatuses(projectSchemaId, schemaId, typeId = null) {
        let response;

        const select = [
            '_task_workflow.statuses.name',
            '_task_workflow.statuses.color',
            '_task_workflow.statuses.sort',
            '_version_workflow.statuses.name',
            '_version_workflow.statuses.color',
            '_version_workflow.statuses.sort',
            '_overrides.type_id',
            '_overrides.workflow_schema.statuses.name',
            '_overrides.workflow_schema.statuses.sort',
            '_overrides.workflow_schema.statuses.color',
            '_overrides.workflow_schema.statuses.sort',
            '_schemas.type_id',
            '_schemas.statuses.task_status.name',
            '_schemas.statuses.task_status.color',
            '_schemas.statuses.task_status.sort',
        ];

        response = this._query(
            `select ${select.join(', ')} from ProjectSchema where id is ${projectSchemaId}`
        );
        response = response.then(
            (result) => {
                const data = result.data[0];
                let statuses = [];
                if (schemaId === 'Task') {
                    statuses = null;

                    if (typeId !== null && data._overrides.length > 0) {
                        for (const index in data._overrides) {
                            if (data._overrides[index].type_id === typeId) {
                                statuses = data._overrides[index].workflow_schema.statuses;
                                break;
                            }
                        }
                    }

                    if (statuses === null) {
                        statuses = data._task_workflow.statuses;
                    }
                } else if (schemaId === 'AssetVersion') {
                    statuses = data._version_workflow.statuses;
                } else {
                    const schema = this.getSchema(schemaId);

                    if (schema && schema.alias_for && schema.alias_for.id === 'Task') {
                        const objectTypeId = schema.alias_for.classifiers.object_typeid;

                        for (const index in data._schemas) {
                            if (data._schemas[index].type_id === objectTypeId) {
                                statuses = data._schemas[index].statuses.map(
                                    (status) => status.task_status
                                );
                            }
                        }
                    }
                }

                return Promise.resolve(statuses);
            }
        );

        return response;
    }

    /**
     * Perform a single query operation with *expression*.
     *
     * Returns a promise which will be resolved with an object containing data
     * and metadata.
     */
    _query(expression) {
        logger.debug('Query ', expression);

        const operation = queryOperation(expression);
        let request = this._call([operation]);
        request = request.then(
            (responses) => {
                const response = responses[0];
                response.data = merge(response.data);
                return response;
            }
        );

        return request;
    }

    /** Return an URL where *componentId* can be downloaded. */
    getComponent(componentId) {
        if (!componentId) {
            return `${this._serverUrl}/img/thumbnail2.png`;
        }

        return (
            `${this._serverUrl}/component/get?id=${componentId}` +
            `&username=${this._apiUser}&apiKey=${this._apiKey}`
        );
    }

    /** Return thumbnail URL for *componentId* with *size*. */
    thumbnail(componentId, size = 300) {
        if (!componentId) {
            return `${this._serverUrl}/img/thumbnail2.png`;
        }

        return (
            `${this._serverUrl}/component/thumbnail?id=${componentId}` +
            `&size=${size}&username=${this._apiUser}&apiKey=${this._apiKey}`
        );
    }
}

export default Session;
