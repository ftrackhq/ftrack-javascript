'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Session = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // :copyright: Copyright (c) 2016 ftrack

var _forIn = require('lodash/forIn');

var _forIn2 = _interopRequireDefault(_forIn);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _event_hub = require('./event_hub');

var _event_hub2 = _interopRequireDefault(_event_hub);

var _operation = require('./operation');

var _error = require('./error');

var _constant = require('./constant');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = _loglevel2.default.getLogger('ftrack_api');

// A list of combined primary keys. If a entity type does not exist in this map
// the primary key will be assumed to be id.
var COMBINED_PRIMARY_KEY_MAP = {
    NoteComponent: ['note_id', 'component_id'],
    Metadata: ['parent_id', 'key'],
    SchemaStatus: ['status_id', 'schema_id']
};

/* Return the identity of *item*. */
function identity(item) {
    if (COMBINED_PRIMARY_KEY_MAP[item.__entity_type__]) {
        var combinedKey = COMBINED_PRIMARY_KEY_MAP[item.__entity_type__].map(function (key) {
            return item[key];
        });
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
    var basename = fileName || '';
    var extension = fileName.slice((Math.max(0, fileName.lastIndexOf('.')) || Infinity) + 1) || '';

    if (extension.length) {
        extension = '.' + extension;
        basename = fileName.slice(0, -1 * extension.length) || '';
    }

    return [basename, extension];
}

/**
 * ftrack API session
 * @class  Session
 *
 */

var Session = exports.Session = function () {

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
    function Session(serverUrl, apiUser, apiKey) {
        var _this = this;

        var _ref = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

        var _ref$autoConnectEvent = _ref.autoConnectEventHub;
        var autoConnectEventHub = _ref$autoConnectEvent === undefined ? false : _ref$autoConnectEvent;
        var _ref$eventHubOptions = _ref.eventHubOptions;
        var eventHubOptions = _ref$eventHubOptions === undefined ? {} : _ref$eventHubOptions;
        var _ref$clientToken = _ref.clientToken;
        var clientToken = _ref$clientToken === undefined ? null : _ref$clientToken;

        _classCallCheck(this, Session);

        if (!serverUrl || !apiUser || !apiKey) {
            throw new Error('Invalid arguments, please construct Session with ' + '*serverUrl*, *apiUser* and *apiKey*.');
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
        this.eventHub = new _event_hub2.default(serverUrl, apiUser, apiKey, eventHubOptions);

        if (autoConnectEventHub) {
            this.eventHub.connect();
        }

        if (clientToken) {
            this.clientToken = clientToken;
        } else {
            this.clientToken = 'ftrack-javascript-api--' + _uuid2.default.v4();
        }

        var operations = [{ action: 'query_server_information' }, { action: 'query_schemas' }];

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
        this.initializing = this.call(operations).then(function (responses) {
            _this.serverInformation = responses[0];
            _this.schemas = responses[1];
            _this.serverVersion = _this.serverInformation.version;
            _this.initialized = true;

            return Promise.resolve(_this);
        });
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


    _createClass(Session, [{
        key: 'decode',
        value: function decode(data) {
            var _this2 = this;

            if (data && data.constructor === Array) {
                return data.map(function (item) {
                    return _this2.decode(item);
                });
            }

            if (data && data.constructor === Object) {
                var _ret = function () {
                    if (data.__type__ === 'datetime') {
                        var adjustedMoment = void 0;
                        if (_this2.serverInformation && _this2.serverInformation.is_timezone_support_enabled) {
                            adjustedMoment = _moment2.default.utc(data.value);
                        } else {
                            adjustedMoment = (0, _moment2.default)(data.value);
                        }
                        adjustedMoment.local();
                        return {
                            v: adjustedMoment
                        };
                    }

                    var out = {};
                    (0, _forIn2.default)(data, function (value, key) {
                        out[key] = _this2.decode(value);
                    });

                    return {
                        v: out
                    };
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }

            return data;
        }

        /**
         * Return merged lazy loaded entities in *data*.
         *
         * @private
         */

    }, {
        key: 'merge',
        value: function merge(data) {
            return this._mergeCollection(data, {});
        }

        /**
         * Return merged *collection* of entities using *identityMap*.
         * @private
         */

    }, {
        key: '_mergeCollection',
        value: function _mergeCollection(collection, identityMap) {
            var _this3 = this;

            var mergedCollection = collection.map(function (item) {
                if (!item.__entity_type__) {
                    // Only process API entity types.
                    return item;
                }

                return _this3._mergeEntity(item, identityMap);
            });

            return mergedCollection;
        }

        /**
         * Return merged *entity* using *identityMap*.
         * @private
         */

    }, {
        key: '_mergeEntity',
        value: function _mergeEntity(entity, identityMap) {
            var _this4 = this;

            var primaryKey = identity(entity);

            if (!primaryKey) {
                // This happens for combined primary keys if the do not exist
                // in COMBINED_PRIMARY_KEY_MAP.
                logger.warn('Key could not be determined for: ', entity);
                return entity;
            }

            var identifier = primaryKey + ',' + entity.__entity_type__;
            if (!identityMap[identifier]) {
                identityMap[identifier] = {};
            }

            var mergedEntity = identityMap[identifier];

            (0, _forIn2.default)(entity, function (value, key) {
                if (value && value.constructor === Array) {
                    mergedEntity[key] = _this4._mergeCollection(value, identityMap);
                } else if (value && value.constructor === Object) {
                    mergedEntity[key] = _this4._mergeEntity(value, identityMap);
                } else {
                    mergedEntity[key] = value;
                }
            });

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

    }, {
        key: 'call',
        value: function call(operations) {
            var _this5 = this;

            var url = this.serverUrl + '/api';

            // Delay call until session is initialized if initialization is in
            // progress.
            var request = new Promise(function (resolve) {
                if (_this5.initializing && !_this5.initialized) {
                    _this5.initializing.then(function () {
                        resolve();
                    });
                } else {
                    resolve();
                }
            });

            request = request.then(function () {
                return fetch(url, {
                    method: 'post',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'ftrack-api-key': _this5.apiKey,
                        'ftrack-user': _this5.apiUser,
                        'ftrack-Clienttoken': _this5.clientToken
                    },
                    body: JSON.stringify(operations)
                });
            });

            // Catch network errors
            request = request.catch(function (reason) {
                logger.warn('Failed to perform request. ', reason);
                return Promise.resolve({
                    exception: 'NetworkError',
                    content: reason.message
                });
            });

            request = request.then(function (response) {
                return response.json && response.json() || response;
            });

            request = request.then(function (data) {
                var result = _this5.decode(data);
                return Promise.resolve(result);
            });

            // Catch badly formatted responses
            request = request.catch(function (reason) {
                logger.warn('Server reported error in unexpected format. ', reason);
                return Promise.resolve({
                    exception: 'MalformedResponseError',
                    content: reason.message,
                    error: reason
                });
            });

            // Reject promise on API exception.
            request = request.then(function (response) {
                if (response.exception) {
                    var message = response.exception + ': ' + response.content;
                    var error = void 0;

                    if (response.exception === 'ValidationError') {
                        error = new _error.ServerValidationError(message);
                    } else if (response.exception === 'FTAuthenticationError') {
                        error = new _error.ServerPermissionDeniedError(message);
                    } else {
                        error = new _error.ServerError(message);
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

    }, {
        key: 'getSchema',
        value: function getSchema(schemaId) {
            for (var index in this.schemas) {
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

    }, {
        key: 'query',
        value: function query(expression) {
            var _this6 = this;

            logger.debug('Query', expression);

            var operation = (0, _operation.queryOperation)(expression);
            var request = this.call([operation]);
            request = request.then(function (responses) {
                var response = responses[0];
                response.data = _this6.merge(response.data);
                return response;
            });

            return request;
        }

        /**
         * Perform a single create operation with *type* and *data*.
         *
         * @param {string} type entity type name.
         * @param {Object} data data which should be used to populate attributes on the entity.
         * @return {Promise} Promise which will be resolved with the response.
         */

    }, {
        key: 'create',
        value: function create(type, data) {
            logger.debug('Create', type, data);

            var request = this.call([(0, _operation.createOperation)(type, data)]);
            request = request.then(function (responses) {
                var response = responses[0];
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

    }, {
        key: 'update',
        value: function update(type, keys, data) {
            logger.debug('Update', type, keys, data);

            var request = this.call([(0, _operation.updateOperation)(type, keys, data)]);
            request = request.then(function (responses) {
                var response = responses[0];
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

    }, {
        key: 'delete',
        value: function _delete(type, id) {
            logger.debug('Delete', type, id);

            var request = this.call([(0, _operation.deleteOperation)(type, id)]);
            request = request.then(function (responses) {
                var response = responses[0];
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

    }, {
        key: 'getComponentUrl',
        value: function getComponentUrl(componentId) {
            if (!componentId) {
                return null;
            }

            return this.serverUrl + '/component/get?id=' + componentId + ('&username=' + this.apiUser + '&apiKey=' + this.apiKey);
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

    }, {
        key: 'thumbnailUrl',
        value: function thumbnailUrl(componentId) {
            var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            var _ref2$size = _ref2.size;
            var size = _ref2$size === undefined ? 300 : _ref2$size;

            if (!componentId) {
                return this.serverUrl + '/img/thumbnail2.png';
            }

            return this.serverUrl + '/component/thumbnail?id=' + componentId + ('&size=' + size + '&username=' + this.apiUser + '&apiKey=' + this.apiKey);
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

    }, {
        key: 'createComponent',
        value: function createComponent(file) {
            var _this7 = this;

            var _ref3 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            var _ref3$data = _ref3.data;
            var data = _ref3$data === undefined ? {} : _ref3$data;

            var fileNameParts = splitFileExtension(file.name);
            var fileType = data.file_type || fileNameParts[1];
            var fileName = data.name || fileNameParts[0];
            var fileSize = data.size || file.size;
            var componentId = data.id || _uuid2.default.v4();

            logger.debug('Fetching upload metadata.');
            var request = this.call([{
                action: 'get_upload_metadata',
                file_name: '' + fileName + fileType,
                file_size: fileSize,
                component_id: componentId
            }]);

            request = request.then(function (response) {
                logger.debug('Uploading file to: ' + response[0].url);

                return fetch(response[0].url, {
                    method: 'put',
                    headers: response[0].headers,
                    body: file
                });
            });

            request = request.then(function () {
                logger.debug('Creating component and component location.');
                var component = Object.assign(data, {
                    id: componentId,
                    name: fileName,
                    file_type: fileType,
                    size: fileSize
                });
                var componentLocation = {
                    component_id: componentId,
                    resource_identifier: componentId,
                    location_id: _constant.SERVER_LOCATION_ID
                };

                return _this7.call([(0, _operation.createOperation)('FileComponent', component), (0, _operation.createOperation)('ComponentLocation', componentLocation)]);
            });

            return request;
        }
    }]);

    return Session;
}();

exports.default = Session;