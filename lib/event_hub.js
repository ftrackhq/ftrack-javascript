'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventHub = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // :copyright: Copyright (c) 2016 ftrack


var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _socket = require('./socket.io-websocket-only');

var _socket2 = _interopRequireDefault(_socket);

var _event = require('./event');

var _event2 = _interopRequireDefault(_event);

var _error = require('./error');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * ftrack API Event hub.
 */
var EventHub = exports.EventHub = function () {

    /**
     * Construct EventHub instance with API credentials.
     * @param  {String} serverUrl             Server URL
     * @param  {String} apiUser               API user
     * @param  {String} apiKey                API key
     * @param  {String} [options.applicationId] Application identifier, added to event source.
     * @constructs EventHub
     */
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
        this._unsentEvents = [];
        this._subscribers = [];
        this._socketIo = null;

        this._handle = this._handle.bind(this);
        this._handleReply = this._handleReply.bind(this);
        this._onSocketConnected = this._onSocketConnected.bind(this);
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

            this._socketIo.on('connect', this._onSocketConnected);
            this._socketIo.on('ftrack.event', this._handle);
        }

        /**
         * Return true if connected to event server.
         * @return {Boolean}
         */

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
            this.logger.debug('Connected to event server.');

            // Subscribe to reply events, if not already subscribed.
            try {
                this.subscribe('topic=ftrack.meta.reply', this._handleReply, { id: this._id });
            } catch (error) {
                if (error instanceof _error.NotUniqueError) {
                    this.logger.debug('Already subscribed to replies.');
                } else {
                    throw error;
                }
            }

            // Now resubscribe any existing stored subscribers. This can happen when
            // reconnecting automatically for example.
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this._subscribers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var subscriber = _step.value;

                    this._notifyServerAboutSubscriber(subscriber);
                }

                // Run any publish callbacks.
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

            var callbacks = this._unsentEvents;
            if (callbacks.length) {
                this._unsentEvents = [];
                this.logger.debug('Publishing ' + callbacks.length + ' unsent events.');
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = callbacks[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var callback = _step2.value;

                        this._runWhenConnected(callback);
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
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
        key: 'publish',
        value: function publish(event) {
            var _this = this;

            var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            var _ref2$onReply = _ref2.onReply;
            var onReply = _ref2$onReply === undefined ? null : _ref2$onReply;
            var _ref2$timeout = _ref2.timeout;
            var timeout = _ref2$timeout === undefined ? 10 : _ref2$timeout;

            event.addSource({
                id: this._id,
                applicationId: this._applicationId,
                user: {
                    username: this._apiUser
                }
            });

            // Copy event data to avoid mutations before async callbacks.
            var eventData = Object.assign({}, event.getData());
            var eventId = eventData.id;

            var onConnected = new Promise(function (resolve, reject) {
                _this._runWhenConnected(resolve);

                if (timeout) {
                    setTimeout(function () {
                        var error = new _error.EventServerConnectionTimeoutError('Unable to connect to event server within timeout.');
                        reject(error);
                    }, timeout * 1000);
                }
            });

            var onPublish = onConnected.then(function () {
                if (onReply) {
                    _this._replyCallbacks[eventId] = onReply;
                }

                _this.logger.debug('Publishing event.', eventData);
                _this._socketIo.emit('ftrack.event', eventData);
                return Promise.resolve(eventId);
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
        key: 'publishAndWaitForReply',
        value: function publishAndWaitForReply(event, _ref3) {
            var _this2 = this;

            var _ref3$timeout = _ref3.timeout;
            var timeout = _ref3$timeout === undefined ? 30 : _ref3$timeout;

            var response = new Promise(function (resolve, reject) {
                var onReply = function onReply(replyEvent) {
                    resolve(replyEvent);
                    _this2._removeReplyCallback(event.id);
                };
                _this2.publish(event, { timeout: timeout, onReply: onReply });

                if (timeout) {
                    setTimeout(function () {
                        var error = new _error.EventServerReplyTimeoutError('No reply event received within timeout.');
                        reject(error);
                        _this2._removeReplyCallback(event.id);
                    }, timeout * 1000);
                }
            });

            return response;
        }
    }, {
        key: '_removeReplyCallback',
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
        key: '_runWhenConnected',
        value: function _runWhenConnected(callback) {
            if (!this.isConnected()) {
                this.logger.debug('Event hub is not connected, event is delayed.');
                this._unsentEvents.push(callback);

                // Force reconnect socket if not automatically reconnected. This
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
        key: 'subscribe',
        value: function subscribe(subscription, callback) {
            var metadata = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

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
        key: '_getExpressionTopic',
        value: function _getExpressionTopic(subscription) {
            // retreive the value of a topic on the format "topic=value"
            var regex = new RegExp('^topic[ ]?=[ \'"]?([\\w-,./*@+]+)[\'"]?$');
            var matches = subscription.trim().match(regex);
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
        key: '_addSubscriber',
        value: function _addSubscriber(subscription, callback) {
            var metadata = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

            // Ensure subscription is on supported format.
            // TODO: Remove once subscription parsing is supported.
            this._getExpressionTopic(subscription);

            if (!metadata.id) {
                metadata.id = _uuid2.default.v4();
            }

            // Check subscriber not already subscribed.
            var existingSubscriber = this.getSubscriberByIdentifier(metadata.id);

            if (existingSubscriber) {
                throw new _error.NotUniqueError('Subscriber with identifier "' + metadata.id + '" already exists.');
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
        key: '_notifyServerAboutSubscriber',
        value: function _notifyServerAboutSubscriber(subscriber) {
            var subscribeEvent = new _event2.default('ftrack.meta.subscribe', {
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
        key: 'getSubscriberByIdentifier',
        value: function getSubscriberByIdentifier(identifier) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this._subscribers.slice()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var subscriber = _step3.value;

                    if (subscriber.metadata.id === identifier) {
                        return subscriber;
                    }
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
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
        key: '_IsSubscriberInterestedIn',
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
        key: '_handle',
        value: function _handle(event) {
            this.logger.debug('Event received', event);

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this._subscribers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
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
                        this.logger.error('Error calling subscriber for event.', error, subscriber, event);
                    }

                    // Publish reply if response isn't null or undefined.
                    if (response != null) {
                        this.publishReply(event, response, subscriber.metadata);
                    }
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }

        /**
         * Handle reply event.
         * @param  {Object} event  Event payload
         */

    }, {
        key: '_handleReply',
        value: function _handleReply(event) {
            this.logger.debug('Reply received', event);
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
        key: 'publishReply',
        value: function publishReply(sourceEvent, data) {
            var source = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

            var replyEvent = new _event2.default('ftrack.meta.reply', data);

            replyEvent._data.target = 'id=' + sourceEvent.source.id;
            replyEvent._data.inReplyToEvent = sourceEvent.id;
            if (source) {
                replyEvent._data.source = source;
            }
            return this.publish(replyEvent);
        }
    }]);

    return EventHub;
}();

exports.default = EventHub;