'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Session = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // :copyright: Copyright (c) 2016 ftrack

var _forIn = require('lodash/forIn');

var _forIn2 = _interopRequireDefault(_forIn);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _find = require('lodash/find');

var _find2 = _interopRequireDefault(_find);

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

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = _loglevel2.default.getLogger('ftrack_api');

var ENCODE_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

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
     * @param  {Array|null} [options.serverInformationValues=null] - List of server information values to retrieve.
     * @param  {Object}  [options.eventHubOptions={}] - Options to configure event hub with.
     *
     * @constructs Session
     */
    function Session(serverUrl, apiUser, apiKey) {
        var _this = this;

        var _ref = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

        var _ref$autoConnectEvent = _ref.autoConnectEventHub;
        var autoConnectEventHub = _ref$autoConnectEvent === undefined ? false : _ref$autoConnectEvent;
        var _ref$serverInformatio = _ref.serverInformationValues;
        var serverInformationValues = _ref$serverInformatio === undefined ? null : _ref$serverInformatio;
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

        // Always include is_timezone_support_enabled as required by API.
        if (serverInformationValues && !serverInformationValues.includes('is_timezone_support_enabled')) {
            serverInformationValues.push('is_timezone_support_enabled');
        }

        var operations = [{ action: 'query_server_information', values: serverInformationValues }, { action: 'query_schemas' }];

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
     * Get primary key attributes from schema
     *
     * @return {Array|null} List of primary key attributes.
     */


    _createClass(Session, [{
        key: 'getPrimaryKeyAttributes',
        value: function getPrimaryKeyAttributes(entityType) {
            var schema = (0, _find2.default)(this.schemas, function (item) {
                return item.id === entityType;
            });
            if (!schema || !schema.primary_key) {
                logger.warn('Primary key could not be found for: ', entityType);
                return null;
            }
            return schema.primary_key;
        }

        /**
         * Get identifying key for *entity*
         *
         * @return {String|null} Identifying key for *entity*
         */

    }, {
        key: 'getIdentifyingKey',
        value: function getIdentifyingKey(entity) {
            var primaryKeys = this.getPrimaryKeyAttributes(entity.__entity_type__);
            if (primaryKeys) {
                return [entity.__entity_type__].concat(_toConsumableArray(primaryKeys.map(function (attribute) {
                    return entity[attribute];
                }))).join(',');
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

    }, {
        key: 'encode',
        value: function encode(data) {
            var _this2 = this;

            if (data && data.constructor === Array) {
                return data.map(function (item) {
                    return _this2.encode(item);
                });
            }

            if (data && data.constructor === Object) {
                var _ret = function () {
                    var out = {};
                    (0, _forIn2.default)(data, function (value, key) {
                        out[key] = _this2.encode(value);
                    });

                    return {
                        v: out
                    };
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }

            if (data && data._isAMomentObject) {
                if (this.serverInformation && this.serverInformation.is_timezone_support_enabled) {
                    // Ensure that the moment object is in UTC and format
                    // to timezone naive string.
                    return {
                        __type__: 'datetime',
                        value: data.utc().format(ENCODE_DATETIME_FORMAT)
                    };
                }

                // Ensure that the moment object is in local time zone and format
                // to timezone naive string.
                return {
                    __type__: 'datetime',
                    value: data.local().format(ENCODE_DATETIME_FORMAT)
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

    }, {
        key: 'getErrorFromResponse',
        value: function getErrorFromResponse(response) {
            var ErrorClass = void 0;

            if (response.exception === 'ValidationError') {
                ErrorClass = _error.ServerValidationError;
            } else if (response.exception === 'FTAuthenticationError' || response.exception === 'PermissionError') {
                ErrorClass = _error.ServerPermissionDeniedError;
            } else {
                ErrorClass = _error.ServerError;
            }

            var error = new ErrorClass(response.content, response.error_code);

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

    }, {
        key: 'decode',
        value: function decode(data) {
            var identityMap = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            if (data == null) {
                return data;
            } else if ((0, _isArray2.default)(data)) {
                return this._decodeArray(data, identityMap);
            } else if ((0, _isPlainObject2.default)(data)) {
                if (data.__entity_type__) {
                    return this._mergeEntity(data, identityMap);
                } else if (data.__type__ === 'datetime') {
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

    }, {
        key: '_decodeDateTime',
        value: function _decodeDateTime(data) {
            if (this.serverInformation && this.serverInformation.is_timezone_support_enabled) {
                // Return date as moment object with UTC set to true.
                return _moment2.default.utc(data.value);
            }

            // Return date as local moment object.
            return (0, _moment2.default)(data.value);
        }

        /**
         * Return new object where all values have been decoded.
         * @private
         */

    }, {
        key: '_decodePlainObject',
        value: function _decodePlainObject(object, identityMap) {
            var _this3 = this;

            return Object.keys(object).reduce(function (previous, key) {
                previous[key] = _this3.decode(object[key], identityMap);
                return previous;
            }, {});
        }

        /**
         * Return new Array where all items have been decoded.
         * @private
         */

    }, {
        key: '_decodeArray',
        value: function _decodeArray(collection, identityMap) {
            var _this4 = this;

            return collection.map(function (item) {
                return _this4.decode(item, identityMap);
            });
        }

        /**
         * Return merged *entity* using *identityMap*.
         * @private
         */

    }, {
        key: '_mergeEntity',
        value: function _mergeEntity(entity, identityMap) {
            var _this5 = this;

            var identifier = this.getIdentifyingKey(entity);
            if (!identifier) {
                logger.warn('Identifier could not be determined for: ', identifier);
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
            var mergedEntity = identityMap[identifier];

            (0, _forIn2.default)(entity, function (value, key) {
                mergedEntity[key] = _this5.decode(value, identityMap);
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
            var _this6 = this;

            var url = this.serverUrl + '/api';

            // Delay call until session is initialized if initialization is in
            // progress.
            var request = new Promise(function (resolve) {
                if (_this6.initializing && !_this6.initialized) {
                    _this6.initializing.then(function () {
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
                        'ftrack-api-key': _this6.apiKey,
                        'ftrack-user': _this6.apiUser,
                        'ftrack-Clienttoken': _this6.clientToken
                    },
                    body: JSON.stringify(_this6.encode(operations))
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
                if (_this6.initialized) {
                    return _this6.decode(data);
                }

                return data;
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
                    return Promise.reject(_this6.getErrorFromResponse(response));
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
            logger.debug('Query', expression);

            var operation = (0, _operation.queryOperation)(expression);
            var request = this.call([operation]);
            request = request.then(function (responses) {
                var response = responses[0];
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