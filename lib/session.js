"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = exports.Session = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _lastIndexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/last-index-of"));

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _parseInt2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/parse-int"));

var _assign = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/assign"));

var _forIn = _interopRequireDefault(require("lodash/forIn"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _isPlainObject = _interopRequireDefault(require("lodash/isPlainObject"));

var _find = _interopRequireDefault(require("lodash/find"));

var _moment = _interopRequireDefault(require("moment"));

var _loglevel = _interopRequireDefault(require("loglevel"));

var _v = _interopRequireDefault(require("uuid/v4"));

var _event_hub = _interopRequireDefault(require("./event_hub"));

var _operation = require("./operation");

var _error = require("./error");

var _constant = require("./constant");

var _encode_uri_parameters = _interopRequireDefault(require("./util/encode_uri_parameters"));

var _normalize_string = _interopRequireDefault(require("./util/normalize_string"));

// :copyright: Copyright (c) 2016 ftrack
var logger = _loglevel["default"].getLogger("ftrack_api");

var ENCODE_DATETIME_FORMAT = "YYYY-MM-DDTHH:mm:ss";
/**
 * Create component from *file* and add to server location.
 *
 * @param  {fileName} The name of the file.
 * @return {array} Array with [basename, extension] from filename.
 */

function splitFileExtension(fileName) {
  var basename = fileName || "";
  var extension = (0, _slice["default"])(fileName).call(fileName, (Math.max(0, (0, _lastIndexOf["default"])(fileName).call(fileName, ".")) || Infinity) + 1) || "";

  if (extension.length) {
    extension = ".".concat(extension);
    basename = (0, _slice["default"])(fileName).call(fileName, 0, -1 * extension.length) || "";
  }

  return [basename, extension];
}
/**
 * ftrack API session
 * @class  Session
 *
 */


var Session = /*#__PURE__*/function () {
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
   * @param  {string} [options.clientToken] - Client token for update events.
   * @param  {string} [options.apiEndpoint=/api] - API endpoint.
   *
   * @constructs Session
   */
  function Session(serverUrl, apiUser, apiKey) {
    var _this = this;

    var _ref = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
        _ref$autoConnectEvent = _ref.autoConnectEventHub,
        autoConnectEventHub = _ref$autoConnectEvent === void 0 ? false : _ref$autoConnectEvent,
        _ref$serverInformatio = _ref.serverInformationValues,
        serverInformationValues = _ref$serverInformatio === void 0 ? null : _ref$serverInformatio,
        _ref$eventHubOptions = _ref.eventHubOptions,
        eventHubOptions = _ref$eventHubOptions === void 0 ? {} : _ref$eventHubOptions,
        _ref$clientToken = _ref.clientToken,
        clientToken = _ref$clientToken === void 0 ? null : _ref$clientToken,
        _ref$apiEndpoint = _ref.apiEndpoint,
        apiEndpoint = _ref$apiEndpoint === void 0 ? "/api" : _ref$apiEndpoint;

    (0, _classCallCheck2["default"])(this, Session);

    if (!serverUrl || !apiUser || !apiKey) {
      throw new Error("Invalid arguments, please construct Session with " + "*serverUrl*, *apiUser* and *apiKey*.");
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

    this.eventHub = new _event_hub["default"](serverUrl, apiUser, apiKey, eventHubOptions);

    if (autoConnectEventHub) {
      this.eventHub.connect();
    }

    if (clientToken) {
      this.clientToken = clientToken;
    } else {
      this.clientToken = "ftrack-javascript-api--".concat((0, _v["default"])());
    } // Always include is_timezone_support_enabled as required by API.


    if (serverInformationValues && !(0, _includes["default"])(serverInformationValues).call(serverInformationValues, "is_timezone_support_enabled")) {
      serverInformationValues.push("is_timezone_support_enabled");
    }

    var operations = [{
      action: "query_server_information",
      values: serverInformationValues
    }, {
      action: "query_schemas"
    }];
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
      return _promise["default"].resolve(_this);
    });
  }
  /**
   * Get primary key attributes from schema
   *
   * @return {Array|null} List of primary key attributes.
   */


  (0, _createClass2["default"])(Session, [{
    key: "getPrimaryKeyAttributes",
    value: function getPrimaryKeyAttributes(entityType) {
      var schema = (0, _find["default"])(this.schemas, function (item) {
        return item.id === entityType;
      });

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

  }, {
    key: "getIdentifyingKey",
    value: function getIdentifyingKey(entity) {
      var primaryKeys = this.getPrimaryKeyAttributes(entity.__entity_type__);

      if (primaryKeys) {
        var _context;

        return (0, _concat["default"])(_context = [entity.__entity_type__]).call(_context, (0, _toConsumableArray2["default"])((0, _map["default"])(primaryKeys).call(primaryKeys, function (attribute) {
          return entity[attribute];
        }))).join(",");
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
    key: "encode",
    value: function encode(data) {
      var _this2 = this;

      if (data && data.constructor === Array) {
        return (0, _map["default"])(data).call(data, function (item) {
          return _this2.encode(item);
        });
      }

      if (data && data.constructor === Object) {
        var out = {};
        (0, _forIn["default"])(data, function (value, key) {
          out[key] = _this2.encode(value);
        });
        return out;
      }

      if (data && data._isAMomentObject) {
        if (this.serverInformation && this.serverInformation.is_timezone_support_enabled) {
          // Ensure that the moment object is in UTC and format
          // to timezone naive string.
          return {
            __type__: "datetime",
            value: data.utc().format(ENCODE_DATETIME_FORMAT)
          };
        } // Ensure that the moment object is in local time zone and format
        // to timezone naive string.


        return {
          __type__: "datetime",
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
    key: "getErrorFromResponse",
    value: function getErrorFromResponse(response) {
      var ErrorClass;

      if (response.exception === "AbortError") {
        ErrorClass = _error.AbortError;
      } else if (response.exception === "ValidationError") {
        ErrorClass = _error.ServerValidationError;
      } else if (response.exception === "FTAuthenticationError" || response.exception === "PermissionError") {
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
    key: "decode",
    value: function decode(data) {
      var identityMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (data == null) {
        return data;
      } else if ((0, _isArray["default"])(data)) {
        return this._decodeArray(data, identityMap);
      } else if ((0, _isPlainObject["default"])(data)) {
        if (data.__entity_type__) {
          return this._mergeEntity(data, identityMap);
        } else if (data.__type__ === "datetime") {
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
    key: "_decodeDateTime",
    value: function _decodeDateTime(data) {
      if (this.serverInformation && this.serverInformation.is_timezone_support_enabled) {
        // Return date as moment object with UTC set to true.
        return _moment["default"].utc(data.value);
      } // Return date as local moment object.


      return (0, _moment["default"])(data.value);
    }
    /**
     * Return new object where all values have been decoded.
     * @private
     */

  }, {
    key: "_decodePlainObject",
    value: function _decodePlainObject(object, identityMap) {
      var _context2,
          _this3 = this;

      return (0, _reduce["default"])(_context2 = (0, _keys["default"])(object)).call(_context2, function (previous, key) {
        previous[key] = _this3.decode(object[key], identityMap);
        return previous;
      }, {});
    }
    /**
     * Return new Array where all items have been decoded.
     * @private
     */

  }, {
    key: "_decodeArray",
    value: function _decodeArray(collection, identityMap) {
      var _this4 = this;

      return (0, _map["default"])(collection).call(collection, function (item) {
        return _this4.decode(item, identityMap);
      });
    }
    /**
     * Return merged *entity* using *identityMap*.
     * @private
     */

  }, {
    key: "_mergeEntity",
    value: function _mergeEntity(entity, identityMap) {
      var _this5 = this;

      var identifier = this.getIdentifyingKey(entity);

      if (!identifier) {
        logger.warn("Identifier could not be determined for: ", identifier);
        return entity;
      }

      if (!identityMap[identifier]) {
        identityMap[identifier] = {};
      } // Retrieve entity from identity map. Any instances which occur multiple
      // times in the encoded data will point to the same JavaScript object.
      // This means that output is not guaranteed to be JSON-serializable.
      //
      // TODO: Should we duplicate the information between the instances
      // instead of pointing them to the same instance?


      var mergedEntity = identityMap[identifier];
      (0, _forIn["default"])(entity, function (value, key) {
        mergedEntity[key] = _this5.decode(value, identityMap);
      });
      return mergedEntity;
    }
    /** Return encoded *operations*. */

  }, {
    key: "encodeOperations",
    value: function encodeOperations(operations) {
      return (0, _stringify["default"])(this.encode(operations));
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
     * @param {Object} options.abortController - Abort controller
     *
     */

  }, {
    key: "call",
    value: function call(operations) {
      var _context3,
          _this6 = this;

      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          abortController = _ref2.abortController;

      var url = (0, _concat["default"])(_context3 = "".concat(this.serverUrl)).call(_context3, this.apiEndpoint); // Delay call until session is initialized if initialization is in
      // progress.

      var request = new _promise["default"](function (resolve) {
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
          method: "post",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "ftrack-api-key": _this6.apiKey,
            "ftrack-user": _this6.apiUser,
            "ftrack-Clienttoken": _this6.clientToken
          },
          body: _this6.encodeOperations(operations),
          signal: abortController && abortController.signal
        });
      }); // Catch network errors

      request = request["catch"](function (reason) {
        logger.warn("Failed to perform request. ", reason);

        if (reason.name === "AbortError") {
          return _promise["default"].resolve({
            exception: "AbortError",
            content: reason.message
          });
        }

        return _promise["default"].resolve({
          exception: "NetworkError",
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
      }); // Catch badly formatted responses

      request = request["catch"](function (reason) {
        logger.warn("Server reported error in unexpected format. ", reason);
        return _promise["default"].resolve({
          exception: "MalformedResponseError",
          content: reason.message,
          error: reason
        });
      }); // Reject promise on API exception.

      request = request.then(function (response) {
        if (response.exception) {
          return _promise["default"].reject(_this6.getErrorFromResponse(response));
        }

        return _promise["default"].resolve(response);
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

  }, {
    key: "ensure",
    value: function ensure(entityType, data) {
      var _context5,
          _context7,
          _this7 = this;

      var identifyingKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var keys = identifyingKeys;
      logger.info("Ensuring entity with data using identifying keys: ", entityType, data, identifyingKeys);

      if (!keys.length) {
        keys = (0, _keys["default"])(data);
      }

      if (!keys.length) {
        var _context4;

        throw new Error("Could not determine any identifying data to check against " + (0, _concat["default"])(_context4 = "when ensuring ".concat(entityType, " with data ")).call(_context4, data, ". ") + "Identifying keys: ".concat(identifyingKeys));
      }

      var primaryKeys = this.getPrimaryKeyAttributes(entityType);
      var expression = (0, _concat["default"])(_context5 = "select ".concat(primaryKeys.join(", "), " from ")).call(_context5, entityType, " where");
      var criteria = (0, _map["default"])(keys).call(keys, function (identifyingKey) {
        var _context6;

        var value = data[identifyingKey];

        if ((0, _isString["default"])(value)) {
          value = "\"".concat(value, "\"");
        } else if (value && value._isAMomentObject) {
          // Server does not store microsecond or timezone currently so
          // need to strip from query.
          value = (0, _moment["default"])(value).utc().format(ENCODE_DATETIME_FORMAT);
          value = "\"".concat(value, "\"");
        }

        return (0, _concat["default"])(_context6 = "".concat(identifyingKey, " is ")).call(_context6, value);
      });
      expression = (0, _concat["default"])(_context7 = "".concat(expression, " ")).call(_context7, criteria.join(" and "));
      return this.query(expression).then(function (response) {
        var _context9;

        if (response.data.length === 0) {
          return _this7.create(entityType, data).then(function (_ref3) {
            var responseData = _ref3.data;
            return _promise["default"].resolve(responseData);
          });
        }

        if (response.data.length !== 1) {
          var _context8;

          throw new Error("Expected single or no item to be found but got multiple " + (0, _concat["default"])(_context8 = "when ensuring ".concat(entityType, " with data ")).call(_context8, data, ". ") + "Identifying keys: ".concat(identifyingKeys));
        }

        var updateEntity = response.data[0]; // Update entity if required.

        var updated = false;
        (0, _forEach["default"])(_context9 = (0, _keys["default"])(data)).call(_context9, function (key) {
          if (data[key] !== updateEntity[key]) {
            updateEntity[key] = data[key];
            updated = true;
          }
        });

        if (updated) {
          var _context10;

          return _this7.update(entityType, (0, _map["default"])(primaryKeys).call(primaryKeys, function (key) {
            return updateEntity[key];
          }), (0, _reduce["default"])(_context10 = (0, _keys["default"])(data)).call(_context10, function (accumulator, key) {
            if ((0, _indexOf["default"])(primaryKeys).call(primaryKeys, key) === -1) {
              accumulator[key] = data[key];
            }

            return accumulator;
          }, {})).then(function (_ref4) {
            var responseData = _ref4.data;
            return _promise["default"].resolve(responseData);
          });
        }

        return _promise["default"].resolve(response.data[0]);
      });
    }
    /**
     * Return schema with id or null if not existing.
     * @param  {string} schemaId Id of schema model, e.g. `AssetVersion`.
     * @return {Object|null} Schema definition
     */

  }, {
    key: "getSchema",
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
     * @param {object} options
     * @param {object} options.abortController - abortController used for aborting requests prematurely
     * @return {Promise} Promise which will be resolved with an object
     * containing data and metadata
     */

  }, {
    key: "query",
    value: function query(expression) {
      var _ref5 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          abortController = _ref5.abortController;

      logger.debug("Query", expression);
      var operation = (0, _operation.queryOperation)(expression);
      var request = this.call([operation], abortController);
      request = request.then(function (responses) {
        var response = responses[0];
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
     * @return {Promise} Promise which will be resolved with an object
     * containing data and metadata
     */

  }, {
    key: "search",
    value: function search(_ref6) {
      var expression = _ref6.expression,
          entityType = _ref6.entityType,
          _ref6$terms = _ref6.terms,
          terms = _ref6$terms === void 0 ? [] : _ref6$terms,
          contextId = _ref6.contextId,
          objectTypeIds = _ref6.objectTypeIds;

      var _ref7 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          abortController = _ref7.abortController;

      logger.debug("Search", {
        expression: expression,
        entityType: entityType,
        terms: terms,
        contextId: contextId,
        objectTypeIds: objectTypeIds
      });
      var operation = (0, _operation.searchOperation)({
        expression: expression,
        entityType: entityType,
        terms: terms,
        contextId: contextId,
        objectTypeIds: objectTypeIds
      });
      var request = this.call([operation], abortController);
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
    key: "create",
    value: function create(type, data) {
      logger.debug("Create", type, data);
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
    key: "update",
    value: function update(type, keys, data) {
      logger.debug("Update", type, keys, data);
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
    key: "delete",
    value: function _delete(type, id) {
      logger.debug("Delete", type, id);
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
    key: "getComponentUrl",
    value: function getComponentUrl(componentId) {
      var _context11;

      if (!componentId) {
        return null;
      }

      var params = {
        id: componentId,
        username: this.apiUser,
        apiKey: this.apiKey
      };
      return (0, _concat["default"])(_context11 = "".concat(this.serverUrl, "/component/get?")).call(_context11, (0, _encode_uri_parameters["default"])(params));
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
    key: "thumbnailUrl",
    value: function thumbnailUrl(componentId) {
      var _context12;

      var _ref8 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref8$size = _ref8.size,
          size = _ref8$size === void 0 ? 300 : _ref8$size;

      if (!componentId) {
        return "".concat(this.serverUrl, "/img/thumbnail2.png");
      }

      var params = {
        id: componentId,
        size: size,
        username: this.apiUser,
        apiKey: this.apiKey
      };
      return (0, _concat["default"])(_context12 = "".concat(this.serverUrl, "/component/thumbnail?")).call(_context12, (0, _encode_uri_parameters["default"])(params));
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
    key: "createComponent",
    value: function createComponent(file) {
      var _context13,
          _this8 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var normalizedFileName = (0, _normalize_string["default"])(file.name);
      var fileNameParts = splitFileExtension(normalizedFileName);

      var defaultProgress = function defaultProgress(progress) {
        return progress;
      };

      var defaultAbort = function defaultAbort() {};

      var data = options.data || {};
      var onProgress = options.onProgress || defaultProgress;
      var xhr = options.xhr || new XMLHttpRequest();
      var onAborted = options.onAborted || defaultAbort;
      var fileType = data.file_type || fileNameParts[1];
      var fileName = data.name || fileNameParts[0];
      var fileSize = data.size || file.size;
      var componentId = data.id || (0, _v["default"])();
      var componentLocationId = (0, _v["default"])();
      var url;
      var headers;

      var updateOnProgressCallback = function updateOnProgressCallback(oEvent) {
        if (oEvent.lengthComputable) {
          onProgress((0, _parseInt2["default"])(oEvent.loaded / oEvent.total * 100, 10));
        }
      };

      logger.debug("Fetching upload metadata.");
      var request = this.call([{
        action: "get_upload_metadata",
        file_name: (0, _concat["default"])(_context13 = "".concat(fileName)).call(_context13, fileType),
        file_size: fileSize,
        component_id: componentId
      }]);
      var componentAndLocationPromise = request.then(function (response) {
        url = response[0].url;
        headers = response[0].headers;
        logger.debug("Creating component and component location.");
        var component = (0, _assign["default"])(data, {
          id: componentId,
          name: fileName,
          file_type: fileType,
          size: fileSize
        });
        var componentLocation = {
          id: componentLocationId,
          component_id: componentId,
          resource_identifier: componentId,
          location_id: _constant.SERVER_LOCATION_ID
        };
        return _this8.call([(0, _operation.createOperation)("FileComponent", component), (0, _operation.createOperation)("ComponentLocation", componentLocation)]);
      });
      return componentAndLocationPromise.then(function () {
        logger.debug("Uploading file to: ".concat(url));
        return new _promise["default"](function (resolve, reject) {
          // wait until file is uploaded
          xhr.upload.addEventListener("progress", updateOnProgressCallback);
          xhr.open("PUT", url, true);

          xhr.onabort = function () {
            onAborted();

            _this8.call([(0, _operation.deleteOperation)("FileComponent", [componentId]), (0, _operation.deleteOperation)("ComponentLocation", [componentLocationId])]).then(function () {
              reject(new _error.CreateComponentError("Upload aborted by client", "UPLOAD_ABORTED"));
            });
          };

          for (var key in headers) {
            if (headers.hasOwnProperty(key) && key !== "Content-Length") {
              xhr.setRequestHeader(key, headers[key]);
            }
          }

          xhr.onload = function () {
            if (xhr.status >= 400) {
              reject(new _error.CreateComponentError("Failed to upload file: ".concat(xhr.status)));
            }

            resolve(xhr.response);
          };

          xhr.onerror = function () {
            reject(new _error.CreateComponentError("Failed to upload file: ".concat(xhr.status)));
          };

          xhr.send(file);
        }).then(function () {
          return componentAndLocationPromise;
        });
      });
    }
  }]);
  return Session;
}();

exports.Session = Session;
var _default = Session;
exports["default"] = _default;