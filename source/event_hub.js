// :copyright: Copyright (c) 2016 ftrack
import io from 'socket.io-client';
import uuid from 'uuid';
import loglevel from 'loglevel';

import Event from './event';
import {
    EventServerConnectionTimeoutError,
    EventServerReplyTimeoutError,
    NotUniqueError,
} from './error';


/**
 * ftrack API Event hub.
 * @private
 */
export class EventHub {

    /** Construct EventHub instance with API credentials. */
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

        this._socketIo.on('connect', this._onSocketConnected.bind(this));
        this._socketIo.on(
            'ftrack.event', this._handle.bind(this)
        );
    }

    /** Return true if connected to event server. */
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

        // Subscribe to reply events.
        this.subscribe('topic=ftrack.meta.reply', this._handleReply);

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
    publish(event, { reply = false, timeout = 10 } = {}) {
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
            this._socketIo.emit('ftrack.event', eventData);
            this.logger.debug('Publishing event.', eventData);
            return Promise.resolve();
        });

        if (reply) {
            const onReply = new Promise((resolve, reject) => {
                this._replyCallbacks[event.getData().id] = resolve;

                if (timeout) {
                    setTimeout(
                        () => {
                            const error = new EventServerReplyTimeoutError(
                                'No reply event received within timeout.'
                            );
                            reject(error);
                        }, timeout * 1000
                    );
                }
            });

            return onReply;
        }

        return onPublish;
    }

    /** Run *callback* if event hub is connected to server. */
    _runWhenConnected(callback) {
        if (!this.isConnected()) {
            this.logger.debug(
                'Event hub is not connected, event is delayed.'
            );
            this._unsentEvents.push(callback);
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
     * See :meth:`subscribe` for argument descriptions.
     *
     * Return subscriber object.
     *
     * Throws an NotUniqueError if a subscriber with
     * the same identifier already exists.
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
     */
    _IsSubscriberInterestedIn(subscriber, event) {
        const topic = this._getExpressionTopic(subscriber.subscription);
        if (topic === event.topic) {
            return true;
        }
        return false;
    }

    /** Handle Events. */
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
                this.logger.error('Error calling subscriber for event.', subscriber, event);
            }

            // Publish reply if response isn't null or undefined.
            if (response != null) {
                this.publishReply(event, response, subscriber.metadata);
            }
        }
    }

    /** Handle reply event. */
    _handleReply(event) {
        this.logger.debug('Event received', event);
        const resolve = this._replyCallbacks[event.inReplyToEvent];
        if (resolve) {
            resolve(event);
        }
    }

    /** Publish reply event. */
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
        this.publish(replyEvent);
    }
}

export default EventHub;
