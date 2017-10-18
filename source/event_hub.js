// :copyright: Copyright (c) 2016 ftrack
import uuid from 'uuid';
import loglevel from 'loglevel';
import io from './socket.io-websocket-only';
import Event from './event';
import {
    EventServerConnectionTimeoutError,
    EventServerReplyTimeoutError,
    NotUniqueError,
} from './error';


/**
 * ftrack API Event hub.
 */
export class EventHub {

    /**
     * Construct EventHub instance with API credentials.
     * @param  {String} serverUrl             Server URL
     * @param  {String} apiUser               API user
     * @param  {String} apiKey                API key
     * @param  {String} [options.applicationId] Application identifier, added to event source.
     * @constructs EventHub
     */
    constructor(serverUrl, apiUser, apiKey, { applicationId = 'ftrack.api.javascript' } = {}) {
        this.logger = loglevel.getLogger('ftrack_api:EventHub');
        this._applicationId = applicationId;
        this._apiUser = apiUser;
        this._apiKey = apiKey;
        this._serverUrl = serverUrl;
        this._id = uuid.v4();
        this._replyCallbacks = {};
        this._unsentEvents = [];
        this._subscribers = [];
        this._socketIo = null;

        this._handle = this._handle.bind(this);
        this._handleReply = this._handleReply.bind(this);
        this._onSocketConnected = this._onSocketConnected.bind(this);
    }

    /** Connect to the event server. */
    connect() {
        this._socketIo = io.connect(this._serverUrl, {
            'max reconnection attempts': Infinity,
            'reconnection limit': 10000,
            'reconnection delay': 5000,
            transports: ['websocket'],
            query: `api_user=${this._apiUser}&api_key=${this._apiKey}`,
        });

        this._socketIo.on('connect', this._onSocketConnected);
        this._socketIo.on('ftrack.event', this._handle);
    }

    /**
     * Return true if connected to event server.
     * @return {Boolean}
     */
    isConnected() {
        return this._socketIo && this._socketIo.socket.connected || false;
    }

    /**
     * Handle on connect event.
     *
     * Subscribe to replies and send any queued events.
     */
    _onSocketConnected() {
        this.logger.debug('Connected to event server.');

        // Subscribe to reply events, if not already subscribed.
        try {
            this.subscribe('topic=ftrack.meta.reply', this._handleReply, { id: this._id });
        } catch (error) {
            if (error instanceof NotUniqueError) {
                this.logger.debug('Already subscribed to replies.');
            } else {
                throw error;
            }
        }

        // Now resubscribe any existing stored subscribers. This can happen when
        // reconnecting automatically for example.
        for (const subscriber of this._subscribers) {
            this._notifyServerAboutSubscriber(subscriber);
        }

        // Run any publish callbacks.
        const callbacks = this._unsentEvents;
        if (callbacks.length) {
            this._unsentEvents = [];
            this.logger.debug(`Publishing ${callbacks.length} unsent events.`);
            for (const callback of callbacks) {
                this._runWhenConnected(callback);
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
    publish(event, { onReply = null, timeout = 10 } = {}) {
        event.addSource(
            {
                id: this._id,
                applicationId: this._applicationId,
                user: {
                    username: this._apiUser,
                },
            }
        );

        // Copy event data to avoid mutations before async callbacks.
        const eventData = Object.assign({}, event.getData());
        const eventId = eventData.id;

        const onConnected = new Promise((resolve, reject) => {
            this._runWhenConnected(resolve);

            if (timeout) {
                setTimeout(
                    () => {
                        const error = new EventServerConnectionTimeoutError(
                            'Unable to connect to event server within timeout.'
                        );
                        reject(error);
                    },
                    timeout * 1000
                );
            }
        });

        const onPublish = onConnected.then(() => {
            if (onReply) {
                this._replyCallbacks[eventId] = onReply;
            }

            this.logger.debug('Publishing event.', eventData);
            this._socketIo.emit('ftrack.event', eventData);
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
    publishAndWaitForReply(event, { timeout = 30 }) {
        const response = new Promise((resolve, reject) => {
            const onReply = (replyEvent) => {
                resolve(replyEvent);
                this._removeReplyCallback(event.id);
            };
            this.publish(event, { timeout, onReply });

            if (timeout) {
                setTimeout(() => {
                    const error = new EventServerReplyTimeoutError(
                        'No reply event received within timeout.'
                    );
                    reject(error);
                    this._removeReplyCallback(event.id);
                }, timeout * 1000);
            }
        });

        return response;
    }

    _removeReplyCallback(eventId) {
        if (this._replyCallbacks[eventId]) {
            delete this._replyCallbacks[eventId];
        }
    }

    /**
     * Run *callback* if event hub is connected to server.
     * @param  {Function} callback
     */
    _runWhenConnected(callback) {
        if (!this.isConnected()) {
            this.logger.debug(
                'Event hub is not connected, event is delayed.'
            );
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
    subscribe(subscription, callback, metadata = {}) {
        const subscriber = this._addSubscriber(
            subscription, callback, metadata
        );
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
    _getExpressionTopic(subscription) {
        // retreive the value of a topic on the format "topic=value"
        const regex = new RegExp('^topic[ ]?=[ \'"]?([\\w-,./*@+]+)[\'"]?$');
        const matches = subscription.trim().match(regex);
        if (matches && matches.length === 2) {
            return matches[1];
        }
        throw new Error(
            'Only subscriptions on the format "topic=value" are supported.'
        );
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
    _addSubscriber(subscription, callback, metadata = {}) {
        // Ensure subscription is on supported format.
        // TODO: Remove once subscription parsing is supported.
        this._getExpressionTopic(subscription);

        if (!metadata.id) {
            metadata.id = uuid.v4();
        }

        // Check subscriber not already subscribed.
        const existingSubscriber = this.getSubscriberByIdentifier(
            metadata.id
        );

        if (existingSubscriber) {
            throw new NotUniqueError(
                `Subscriber with identifier "${metadata.id}" already exists.`
            );
        }

        const subscriber = {
            subscription,
            callback,
            metadata,
        };
        this._subscribers.push(subscriber);
        return subscriber;
    }

    /**
     * Notify server of new *subscriber*.
     * @param  {Object} subscriber      subscriber information
     */
    _notifyServerAboutSubscriber(subscriber) {
        const subscribeEvent = new Event(
            'ftrack.meta.subscribe',
            {
                subscriber: subscriber.metadata,
                subscription: subscriber.subscription,
            }
        );
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
    getSubscriberByIdentifier(identifier) {
        for (const subscriber of this._subscribers.slice()) {
            if (subscriber.metadata.id === identifier) {
                return subscriber;
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
    _IsSubscriberInterestedIn(subscriber, event) {
        const topic = this._getExpressionTopic(subscriber.subscription);
        if (topic === event.topic) {
            return true;
        }
        return false;
    }

    /**
     * Handle Events.
     * @param  {Object} event   Event payload
     */
    _handle(event) {
        this.logger.debug('Event received', event);

        for (const subscriber of this._subscribers) {
            // TODO: Parse event target and check that it matches subscriber.

            // TODO: Support full expression format as used in Python.
            if (!this._IsSubscriberInterestedIn(subscriber, event)) {
                continue;
            }

            let response = null;
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
    }

    /**
     * Handle reply event.
     * @param  {Object} event  Event payload
     */
    _handleReply(event) {
        this.logger.debug('Reply received', event);
        const onReplyCallback = this._replyCallbacks[event.inReplyToEvent];
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
    publishReply(sourceEvent, data, source = null) {
        const replyEvent = new Event(
            'ftrack.meta.reply',
            data
        );

        replyEvent._data.target = `id=${sourceEvent.source.id}`;
        replyEvent._data.inReplyToEvent = sourceEvent.id;
        if (source) {
            replyEvent._data.source = source;
        }
        return this.publish(replyEvent);
    }
}

export default EventHub;
