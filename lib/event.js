'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventHub = exports.Event = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // :copyright: Copyright (c) 2016 ftrack


var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _error = require('./error');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * ftrack API Event class.
 * @private
 */

var Event = exports.Event = function () {
    /**
     * Construct Event instance with *topic*, *data* and additional *options*.
     *
     * *topic* should be a string representing the event.
     *
     * *data* should be an object with the event payload.
     */

    function Event(topic, data) {
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        _classCallCheck(this, Event);

        this._data = Object.assign({
            topic: topic,
            data: data,
            target: '',
            inReplyToEvent: null
        }, options, {
            id: _uuid2.default.v4(),
            sent: null
        });
    }

    /** Return event data. */


    _createClass(Event, [{
        key: 'getData',
        value: function getData() {
            return this._data;
        }

        /** Add source to event data. */

    }, {
        key: 'addSource',
        value: function addSource(source) {
            this._data.source = source;
        }
    }]);

    return Event;
}();

/**
 * ftrack API Event hub.
 * @private
 */


var EventHub = exports.EventHub = function () {

    /** Construct EventHub instance with API credentials. */

    function EventHub(serverUrl, apiUser, apiKey) {
        var _ref = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

        var _ref$applicationId = _ref.applicationId;
        var applicationId = _ref$applicationId === undefined ? 'ftrack.api.javascript' : _ref$applicationId;

        _classCallCheck(this, EventHub);

        this.logger = _loglevel2.default.getLogger('ftrack_api:EventHub');
        this._applicationId = applicationId;
        this._apiUser = apiUser;
        this._apiKey = apiKey;
        this._serverUrl = serverUrl;
        this._id = _uuid2.default.v4();
        this._replyCallbacks = {};
        this._callbacks = [];
        this._socketIo = null;
    }

    /** Connect to the event server. */


    _createClass(EventHub, [{
        key: 'connect',
        value: function connect() {
            this._socketIo = _socket2.default.connect(this._serverUrl, {
                'max reconnection attempts': Infinity,
                'reconnection limit': 10000,
                'reconnection delay': 5000,
                transports: ['websocket'],
                query: 'api_user=' + this._apiUser + '&api_key=' + this._apiKey
            });

            this._socketIo.on('connect', this._onSocketConnected.bind(this));
            this._socketIo.on('ftrack.event', this._handleEvent.bind(this));
        }

        /** Return true if connected to event server. */

    }, {
        key: 'isConnected',
        value: function isConnected() {
            return this._socketIo && this._socketIo.socket.connected || false;
        }

        /**
         * Handle on connect event.
         *
         * Subscribe to replies and send any queued events.
         */

    }, {
        key: '_onSocketConnected',
        value: function _onSocketConnected() {
            var _this = this;

            this.logger.debug('Connected to event server.');

            // Subscribe to reply events.
            this.subscribe('topic=ftrack.meta.reply').catch(function (error) {
                _this.logger.debug('Unable to subscribe to replies.', error);
            });

            // Run any publish callbacks.
            var callbacks = this._callbacks;
            if (callbacks.length) {
                this._callbacks = [];
                this.logger.debug('Publishing ' + callbacks.length + ' unsent events.');
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = callbacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var callback = _step.value;

                        this._runWhenConnected(callback);
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        }

        /**
         * Publish event and return promise.
         *
         * If *reply* is true, the promise will wait for a response and resolve
         * with the reply event. Otherwise, the promise will be resolved once the
         * event has been sent.
         *
         * If timeout is non-zero, the promise will be rejected if the timeout is
         * reached before it is resolved. Should be specified as seconds and will
         * default to 10.
         */

    }, {
        key: 'publish',
        value: function publish(event, _ref2) {
            var _this2 = this;

            var _ref2$reply = _ref2.reply;
            var reply = _ref2$reply === undefined ? false : _ref2$reply;
            var _ref2$timeout = _ref2.timeout;
            var timeout = _ref2$timeout === undefined ? 10 : _ref2$timeout;

            event.addSource({
                id: this._id,
                applicationId: 'ftrack.client.spark',
                user: {
                    username: this._apiUser
                }
            });

            // Copy event data to avoid mutations before async callbacks.
            var eventData = Object.assign({}, event.getData());

            var onConnected = new Promise(function (resolve, reject) {
                _this2._runWhenConnected(resolve);

                if (timeout) {
                    setTimeout(function () {
                        var error = new _error.EventServerConnectionTimeoutError('Unable to connect to event server within timeout.');
                        reject(error);
                    }, timeout * 1000);
                }
            });

            var onPublish = onConnected.then(function () {
                _this2._socketIo.emit('ftrack.event', eventData);
                _this2.logger.debug('Publishing event.', eventData);
                return Promise.resolve();
            });

            if (reply) {
                var onReply = new Promise(function (resolve, reject) {
                    _this2._replyCallbacks[event.getData().id] = resolve;

                    if (timeout) {
                        setTimeout(function () {
                            var error = new _error.EventServerReplyTimeoutError('No reply event received within timeout.');
                            reject(error);
                        }, timeout * 1000);
                    }
                });

                return onReply;
            }

            return onPublish;
        }

        /** Run *callback* if event hub is connected to server. */

    }, {
        key: '_runWhenConnected',
        value: function _runWhenConnected(callback) {
            if (!this.isConnected()) {
                this.logger.debug('Event hub is not connected, event is delayed.');
                this._callbacks.push(callback);
            } else {
                callback();
            }
        }

        /**
         * Register to *subscription* events.
         *
         * .. note::
         *
         *      Currently, it is not possible to register callbacks and only
         *      reply events are handled.
         */

    }, {
        key: 'subscribe',
        value: function subscribe(subscription) {
            var subscribeEvent = new Event('ftrack.meta.subscribe', {
                subscriber: {
                    id: this._id,
                    applicationId: this._applicationId
                },
                subscription: subscription
            });

            return this.publish(subscribeEvent, false, 0);
        }

        /** Handle replies. */

    }, {
        key: '_handleEvent',
        value: function _handleEvent(event) {
            this.logger.debug('Event received', event);
            var resolve = this._replyCallbacks[event.inReplyToEvent];
            if (resolve) {
                resolve(event);
            }

            // TODO: Handle other subscriptions.
        }
    }]);

    return EventHub;
}();

exports.default = Event;