"use strict";

var _sliceInstanceProperty2 = require("@babel/runtime-corejs3/core-js-stable/instance/slice");

var _Array$from = require("@babel/runtime-corejs3/core-js-stable/array/from");

var _Symbol = require("@babel/runtime-corejs3/core-js-stable/symbol");

var _getIteratorMethod = require("@babel/runtime-corejs3/core-js/get-iterator-method");

var _Array$isArray = require("@babel/runtime-corejs3/core-js-stable/array/is-array");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = exports.EventHub = void 0;

var _lastIndexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/last-index-of"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _bind = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/bind"));

var _assign = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/assign"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _setTimeout2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set-timeout"));

var _trim = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/trim"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _v = _interopRequireDefault(require("uuid/v4"));

var _loglevel = _interopRequireDefault(require("loglevel"));

var _socket = _interopRequireDefault(require("./socket.io-websocket-only"));

var _event = _interopRequireDefault(require("./event"));

var _error = require("./error");

var _encode_uri_parameters = _interopRequireDefault(require("./util/encode_uri_parameters"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof _Symbol !== "undefined" && _getIteratorMethod(o) || o["@@iterator"]; if (!it) { if (_Array$isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { var _context6; if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = _sliceInstanceProperty2(_context6 = Object.prototype.toString.call(o)).call(_context6, 8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return _Array$from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * ftrack API Event hub.
 */
var EventHub = /*#__PURE__*/function () {
  /**
   * Construct EventHub instance with API credentials.
   * @param  {String} serverUrl             Server URL
   * @param  {String} apiUser               API user
   * @param  {String} apiKey                API key
   * @param  {String} [options.applicationId] Application identifier, added to event source.
   * @constructs EventHub
   */
  function EventHub(serverUrl, apiUser, apiKey) {
    var _context2, _context3, _context4;

    var _ref = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
        _ref$applicationId = _ref.applicationId,
        applicationId = _ref$applicationId === void 0 ? "ftrack.api.javascript" : _ref$applicationId;

    (0, _classCallCheck2["default"])(this, EventHub);
    this.logger = _loglevel["default"].getLogger("ftrack_api:EventHub");
    this._applicationId = applicationId;
    this._apiUser = apiUser;
    this._apiKey = apiKey; // Socket.IO guesses port based on the current web page instead of
    // the server URL, which causes issues when using the API on a page
    // hosted on a non-standard port.

    var portRegex = new RegExp("\\:\\d+$");

    if (serverUrl.match(portRegex)) {
      this._serverUrl = serverUrl;
    } else {
      var _context;

      var port = (0, _lastIndexOf["default"])(serverUrl).call(serverUrl, "https", 0) === 0 ? "443" : "80";
      this._serverUrl = (0, _concat["default"])(_context = "".concat(serverUrl, ":")).call(_context, port);
    }

    this._id = (0, _v["default"])();
    this._replyCallbacks = {};
    this._unsentEvents = [];
    this._subscribers = [];
    this._socketIo = null;
    this._handle = (0, _bind["default"])(_context2 = this._handle).call(_context2, this);
    this._handleReply = (0, _bind["default"])(_context3 = this._handleReply).call(_context3, this);
    this._onSocketConnected = (0, _bind["default"])(_context4 = this._onSocketConnected).call(_context4, this);
  }
  /** Connect to the event server. */


  (0, _createClass2["default"])(EventHub, [{
    key: "connect",
    value: function connect() {
      this._socketIo = _socket["default"].connect(this._serverUrl, {
        "max reconnection attempts": Infinity,
        "reconnection limit": 10000,
        "reconnection delay": 5000,
        transports: ["websocket"],
        query: (0, _encode_uri_parameters["default"])({
          api_user: this._apiUser,
          api_key: this._apiKey
        })
      });

      this._socketIo.on("connect", this._onSocketConnected);

      this._socketIo.on("ftrack.event", this._handle);
    }
    /**
     * Return true if connected to event server.
     * @return {Boolean}
     */

  }, {
    key: "isConnected",
    value: function isConnected() {
      return this._socketIo && this._socketIo.socket.connected || false;
    }
    /**
     * Handle on connect event.
     *
     * Subscribe to replies and send any queued events.
     */

  }, {
    key: "_onSocketConnected",
    value: function _onSocketConnected() {
      this.logger.debug("Connected to event server."); // Subscribe to reply events, if not already subscribed.

      try {
        this.subscribe("topic=ftrack.meta.reply", this._handleReply, {
          id: this._id
        });
      } catch (error) {
        if (error instanceof _error.NotUniqueError) {
          this.logger.debug("Already subscribed to replies.");
        } else {
          throw error;
        }
      } // Now resubscribe any existing stored subscribers. This can happen when
      // reconnecting automatically for example.


      var _iterator = _createForOfIteratorHelper(this._subscribers),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var subscriber = _step.value;

          this._notifyServerAboutSubscriber(subscriber);
        } // Run any publish callbacks.

      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      var callbacks = this._unsentEvents;

      if (callbacks.length) {
        this._unsentEvents = [];
        this.logger.debug("Publishing ".concat(callbacks.length, " unsent events."));

        var _iterator2 = _createForOfIteratorHelper(callbacks),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var callback = _step2.value;

            this._runWhenConnected(callback);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
    }
    /**
     * Publish event and return promise resolved with event id when event has
     * been sent.
     *
     * If *onReply* is specified, it will be invoked when any replies are
     * received.
     *
     * If timeout is non-zero, the promise will be rejected if the event is not
     * sent before the timeout is reached. Should be specified as seconds and
     * will default to 10.
     *
     * @param  {Event}  event               Event instance to publish
     * @param  {Function} [options.onReply] Function to be invoked when a reply
     *                                      is received.
     * @param  {Number}  [options.timeout]  Timeout in seconds
     * @return {Promise}
     */

  }, {
    key: "publish",
    value: function publish(event) {
      var _this = this;

      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref2$onReply = _ref2.onReply,
          onReply = _ref2$onReply === void 0 ? null : _ref2$onReply,
          _ref2$timeout = _ref2.timeout,
          timeout = _ref2$timeout === void 0 ? 10 : _ref2$timeout;

      event.addSource({
        id: this._id,
        applicationId: this._applicationId,
        user: {
          username: this._apiUser
        }
      }); // Copy event data to avoid mutations before async callbacks.

      var eventData = (0, _assign["default"])({}, event.getData());
      var eventId = eventData.id;
      var onConnected = new _promise["default"](function (resolve, reject) {
        _this._runWhenConnected(resolve);

        if (timeout) {
          (0, _setTimeout2["default"])(function () {
            var error = new _error.EventServerConnectionTimeoutError("Unable to connect to event server within timeout.");
            reject(error);
          }, timeout * 1000);
        }
      });
      var onPublish = onConnected.then(function () {
        if (onReply) {
          _this._replyCallbacks[eventId] = onReply;
        }

        _this.logger.debug("Publishing event.", eventData);

        _this._socketIo.emit("ftrack.event", eventData);

        return _promise["default"].resolve(eventId);
      });
      return onPublish;
    }
    /**
     * Publish event and wait for a single reply.
     *
     * Returns promise resolved with reply event if received within timeout.
     *
     * @param  {Event}  event               Event instance to publish
     * @param  {Number}  [options.timeout]  Timeout in seconds [30]
     * @return {Promise}
     */

  }, {
    key: "publishAndWaitForReply",
    value: function publishAndWaitForReply(event, _ref3) {
      var _this2 = this;

      var _ref3$timeout = _ref3.timeout,
          timeout = _ref3$timeout === void 0 ? 30 : _ref3$timeout;
      var response = new _promise["default"](function (resolve, reject) {
        var onReply = function onReply(replyEvent) {
          resolve(replyEvent);

          _this2._removeReplyCallback(event.id);
        };

        _this2.publish(event, {
          timeout: timeout,
          onReply: onReply
        });

        if (timeout) {
          (0, _setTimeout2["default"])(function () {
            var error = new _error.EventServerReplyTimeoutError("No reply event received within timeout.");
            reject(error);

            _this2._removeReplyCallback(event.id);
          }, timeout * 1000);
        }
      });
      return response;
    }
  }, {
    key: "_removeReplyCallback",
    value: function _removeReplyCallback(eventId) {
      if (this._replyCallbacks[eventId]) {
        delete this._replyCallbacks[eventId];
      }
    }
    /**
     * Run *callback* if event hub is connected to server.
     * @param  {Function} callback
     */

  }, {
    key: "_runWhenConnected",
    value: function _runWhenConnected(callback) {
      if (!this.isConnected()) {
        this.logger.debug("Event hub is not connected, event is delayed.");

        this._unsentEvents.push(callback); // Force reconnect socket if not automatically reconnected. This
        // happens for example in Adobe After Effects when rendering a
        // sequence takes longer than ~30s and the JS thread is blocked.


        this._socketIo.socket.reconnect();
      } else {
        callback();
      }
    }
    /**
     * Register to *subscription* events.
     *
     * @param  {String}   subscription  Expression to subscribe on. Currently,
     *                                  only "topic=value" expressions are
     *                                  supported.
     * @param  {Function} callback      Function to be called when an event
     *                                  matching the subscription is returned.
     * @param  {Object}   [metadata]    Optional information about subscriber.
     * @return {String}                 Subscriber ID.
     */

  }, {
    key: "subscribe",
    value: function subscribe(subscription, callback) {
      var metadata = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var subscriber = this._addSubscriber(subscription, callback, metadata);

      this._notifyServerAboutSubscriber(subscriber);

      return subscriber.metadata.id;
    }
    /**
     * Return topic from *subscription* expression.
     *
     * Raises an error if expression is in an unsupported format. Currently,
     * only expressions on the format topic=value is supported.
     *
     * @param  {String} subscription    expression
     * @return {String}                 topic
     */

  }, {
    key: "_getExpressionTopic",
    value: function _getExpressionTopic(subscription) {
      // retreive the value of a topic on the format "topic=value"
      var regex = new RegExp("^topic[ ]?=[ '\"]?([\\w-,./*@+]+)['\"]?$");
      var matches = (0, _trim["default"])(subscription).call(subscription).match(regex);

      if (matches && matches.length === 2) {
        return matches[1];
      }

      throw new Error('Only subscriptions on the format "topic=value" are supported.');
    }
    /**
     * Add subscriber locally.
     *
     * Throws an NotUniqueError if a subscriber with
     * the same identifier already exists.
     *
     * @param {String}   subscription   expression
     * @param {Function} callback       Function to be called when an event is received.
     * @param {Object}   metadata       Optional information about subscriber.
     * @return {Object}                 subscriber information.
     */

  }, {
    key: "_addSubscriber",
    value: function _addSubscriber(subscription, callback) {
      var metadata = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      // Ensure subscription is on supported format.
      // TODO: Remove once subscription parsing is supported.
      this._getExpressionTopic(subscription);

      if (!metadata.id) {
        metadata.id = (0, _v["default"])();
      } // Check subscriber not already subscribed.


      var existingSubscriber = this.getSubscriberByIdentifier(metadata.id);

      if (existingSubscriber) {
        throw new _error.NotUniqueError("Subscriber with identifier \"".concat(metadata.id, "\" already exists."));
      }

      var subscriber = {
        subscription: subscription,
        callback: callback,
        metadata: metadata
      };

      this._subscribers.push(subscriber);

      return subscriber;
    }
    /**
     * Notify server of new *subscriber*.
     * @param  {Object} subscriber      subscriber information
     */

  }, {
    key: "_notifyServerAboutSubscriber",
    value: function _notifyServerAboutSubscriber(subscriber) {
      var subscribeEvent = new _event["default"]("ftrack.meta.subscribe", {
        subscriber: subscriber.metadata,
        subscription: subscriber.subscription
      });
      this.publish(subscribeEvent);
    }
    /**
     * Return subscriber with matching *identifier*.
     *
     * Return null if no subscriber with *identifier* found.
     *
     * @param  {String} identifier
     * @return {String|null}
     */

  }, {
    key: "getSubscriberByIdentifier",
    value: function getSubscriberByIdentifier(identifier) {
      var _context5;

      var _iterator3 = _createForOfIteratorHelper((0, _slice["default"])(_context5 = this._subscribers).call(_context5)),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var subscriber = _step3.value;

          if (subscriber.metadata.id === identifier) {
            return subscriber;
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }

      return null;
    }
    /**
     * Return if *subscriber* is interested in *event*.
     *
     * Only expressions on the format topic=value is supported.
     *
     * TODO: Support the full event expression format.
     *
     * @param  {Object} subscriber
     * @param  {Object} event
     * @return {Boolean}
     */

  }, {
    key: "_IsSubscriberInterestedIn",
    value: function _IsSubscriberInterestedIn(subscriber, event) {
      var topic = this._getExpressionTopic(subscriber.subscription);

      if (topic === event.topic) {
        return true;
      }

      return false;
    }
    /**
     * Handle Events.
     * @param  {Object} event   Event payload
     */

  }, {
    key: "_handle",
    value: function _handle(event) {
      this.logger.debug("Event received", event);

      var _iterator4 = _createForOfIteratorHelper(this._subscribers),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var subscriber = _step4.value;

          // TODO: Parse event target and check that it matches subscriber.
          // TODO: Support full expression format as used in Python.
          if (!this._IsSubscriberInterestedIn(subscriber, event)) {
            continue;
          }

          var response = null;

          try {
            response = subscriber.callback(event);
          } catch (error) {
            this.logger.error("Error calling subscriber for event.", error, subscriber, event);
          } // Publish reply if response isn't null or undefined.


          if (response != null) {
            this.publishReply(event, response, subscriber.metadata);
          }
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
    /**
     * Handle reply event.
     * @param  {Object} event  Event payload
     */

  }, {
    key: "_handleReply",
    value: function _handleReply(event) {
      this.logger.debug("Reply received", event);
      var onReplyCallback = this._replyCallbacks[event.inReplyToEvent];

      if (onReplyCallback) {
        onReplyCallback(event);
      }
    }
    /**
     * Publish reply event.
     * @param  {Object} sourceEvent Source event payload
     * @param  {Object} data        Response event data
     * @param  {Object} [source]    Response event source information
     */

  }, {
    key: "publishReply",
    value: function publishReply(sourceEvent, data) {
      var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var replyEvent = new _event["default"]("ftrack.meta.reply", data);
      replyEvent._data.target = "id=".concat(sourceEvent.source.id);
      replyEvent._data.inReplyToEvent = sourceEvent.id;

      if (source) {
        replyEvent._data.source = source;
      }

      return this.publish(replyEvent);
    }
  }]);
  return EventHub;
}();

exports.EventHub = EventHub;
var _default = EventHub;
exports["default"] = _default;