// :copyright: Copyright (c) 2016 ftrack
import io from 'socket.io-client';
import uuid from 'uuid';
import loglevel from 'loglevel';
import { EventServerConnectionTimeoutError, EventServerReplyTimeoutError } from './error';

/**
 * ftrack API Event class.
 */
export class Event {
    /**
     * Construct Event instance with *topic*, *data* and additional *options*.
     *
     * *topic* should be a string representing the event.
     *
     * *data* should be an object with the event payload.
     */
    constructor(topic, data, options = {}) {
        this._data = Object.assign(
            {
                topic,
                data,
                target: '',
                inReplyToEvent: null,
            },
            options,
            {
                id: uuid.v4(),
                sent: null,
            }
        );
    }

    /** Return event data. */
    getData() {
        return this._data;
    }

    /** Add source to event data. */
    addSource(source) {
        this._data.source = source;
    }

}

/**
 * ftrack API Event hub.
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
        this._callbacks = [];
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
            'ftrack.event', this._handleEvent.bind(this)
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
        this.subscribe('topic=ftrack.meta.reply').catch((error) => {
            this.logger.debug('Unable to subscribe to replies.', error);
        });

        // Run any publish callbacks.
        const callbacks = this._callbacks;
        if (callbacks.length) {
            this._callbacks = [];
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
    publish(event, { reply = false, timeout = 10 }) {
        event.addSource(
            {
                id: this._id,
                applicationId: 'ftrack.client.spark',
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
    subscribe(subscription) {
        const subscribeEvent = new Event(
            'ftrack.meta.subscribe',
            {
                subscriber: {
                    id: this._id,
                    applicationId: this._applicationId,
                },
                subscription,
            }
        );

        return this.publish(subscribeEvent, false, 0);
    }

    /** Handle replies. */
    _handleEvent(event) {
        this.logger.debug('Event received', event);
        const resolve = this._replyCallbacks[event.inReplyToEvent];
        if (resolve) {
            resolve(event);
        }

        // TODO: Handle other subscriptions.
    }

}

export default Event;

