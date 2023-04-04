// :copyright: Copyright (c) 2016 ftrack
import { v4 as uuidV4 } from "uuid";
import loglevel from "loglevel";
import io, { SocketIO } from "./socket.io-websocket-only.cjs";
import { Event } from "./event";
import {
  EventServerConnectionTimeoutError,
  EventServerReplyTimeoutError,
  EventServerPublishError,
  NotUniqueError,
} from "./error";
import { Data } from "./types";

interface BaseActionData {
  selection: Array<{
    entityId: string;
    entityType: string;
  }>;
}

interface BaseEventPayload {
  target: string;
  source: EventSource;
  id: string;
  inReplyToEvent?: string;
  sent?: boolean;
}

export interface ActionDiscoverEventPayload extends BaseEventPayload {
  topic: "ftrack.action.discover";
  data: BaseActionData;
}

export interface ActionLaunchEventData extends BaseActionData {
  actionIdentifier: string;
  description?: string;
  label?: string;
  applicationIdentifier?: string;
}

export interface ActionLaunchEventPayload extends BaseEventPayload {
  topic: "ftrack.action.launch";
  data: ActionLaunchEventData;
}

export interface UpdateEventData {
  entities?: EventEntity[];
  pushToken?: string;
  parents?: string[];
  user?: {
    userid: string;
    name: string;
  };
  clientToken?: string;
}

export interface UpdateEventPayload extends BaseEventPayload {
  topic: "ftrack.update";
  data: UpdateEventData;
}

export type EventPayload =
  | ActionLaunchEventPayload
  | ActionDiscoverEventPayload
  | UpdateEventPayload;

export interface EventSource {
  clientToken: string;
  applicationId: string;
  user: {
    username: string;
    id: string;
  };
  id: string;
}

export interface EventEntity {
  entity_type?: string;
  keys?: string[];
  objectTypeId?: string;
  entityType?: string;
  parents?: {
    entityId: string;
    entityType: string;
    entity_type: string;
    parentId?: string;
  }[];
  parentId?: string;
  action?: string;
  entityId?: string;
  changes?: Data;
}

export interface SubscriberMetadata {
  id: string;
  [key: string]: any;
}

export interface Subscriber {
  metadata: SubscriberMetadata;
  callback: EventCallback;
  subscription: string;
}

export interface EventCallback {
  (eventPayload: EventPayload): any;
}

export interface ConnectionCallback {
  (): any;
}

/**
 * ftrack API Event hub.
 */
export class EventHub {
  private logger: loglevel.Logger;
  private _applicationId: string;
  private _apiUser: string;
  private _apiKey: string;
  private _serverUrl: string;
  private _id: string;
  private _replyCallbacks: {
    [key: string]: EventCallback;
  };
  private _unsentEvents: ConnectionCallback[];
  private _subscribers: Subscriber[];
  private _socketIo: SocketIO | null;

  /**
   * Construct EventHub instance with API credentials.
   * @param  {String} serverUrl             Server URL
   * @param  {String} apiUser               API user
   * @param  {String} apiKey                API key
   * @param  {String} [options.applicationId] Application identifier, added to event source.
   * @constructs EventHub
   */
  constructor(
    serverUrl: string,
    apiUser: string,
    apiKey: string,
    { applicationId = "ftrack.api.javascript" }: { applicationId?: string } = {}
  ) {
    this.logger = loglevel.getLogger("ftrack_api:EventHub");
    this._applicationId = applicationId;
    this._apiUser = apiUser;
    this._apiKey = apiKey;

    // Socket.IO guesses port based on the current web page instead of
    // the server URL, which causes issues when using the API on a page
    // hosted on a non-standard port.
    const portRegex = new RegExp("\\:\\d+$");
    if (serverUrl.match(portRegex)) {
      this._serverUrl = serverUrl;
    } else {
      const port = serverUrl.lastIndexOf("https", 0) === 0 ? "443" : "80";
      this._serverUrl = `${serverUrl}:${port}`;
    }

    this._id = uuidV4();
    this._replyCallbacks = {};
    this._unsentEvents = [];
    this._subscribers = [];
    this._socketIo = null;

    this._handle = this._handle.bind(this);
    this._handleReply = this._handleReply.bind(this);
    this._onSocketConnected = this._onSocketConnected.bind(this);
  }

  /** Connect to the event server. */
  connect(): void {
    this._socketIo = io.connect(this._serverUrl, {
      "max reconnection attempts": Infinity,
      "reconnection limit": 10000,
      "reconnection delay": 5000,
      transports: ["websocket"],
      query: new URLSearchParams({
        api_user: this._apiUser,
        api_key: this._apiKey,
      }).toString(),
    });

    this._socketIo.on("connect", this._onSocketConnected);
    this._socketIo.on("ftrack.event", this._handle);
  }

  /**
   * Return true if connected to event server.
   * @return {Boolean}
   */
  isConnected(): boolean {
    return (this._socketIo && this._socketIo.socket.connected) || false;
  }

  /**
   * Handle on connect event.
   *
   * Subscribe to replies and send any queued events.
   */
  private _onSocketConnected() {
    this.logger.debug("Connected to event server.");

    // Subscribe to reply events, if not already subscribed.
    try {
      this.subscribe("topic=ftrack.meta.reply", this._handleReply, {
        id: this._id,
      });
    } catch (error) {
      if (error instanceof NotUniqueError) {
        this.logger.debug("Already subscribed to replies.");
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
   * @param  {Number}  [options.timeout]  Timeout in seconds. Defaults to 30.
   * @return {Promise}
   */
  publish(
    event: Event,
    {
      onReply,
      timeout = 30,
    }: {
      onReply?: EventCallback;
      timeout?: number;
    } = {}
  ): Promise<string> {
    if (!this._socketIo) {
      throw new EventServerPublishError(
        "Unable to publish event, not connected to server."
      );
    }

    event.addSource({
      id: this._id,
      applicationId: this._applicationId,
      user: {
        username: this._apiUser,
      },
    });

    // Copy event data to avoid mutations before async callbacks.
    const eventData = Object.assign({}, event.getData());
    const eventId = eventData.id;

    const onConnected = new Promise<void>((resolve, reject) => {
      this._runWhenConnected(resolve);

      if (timeout) {
        setTimeout(() => {
          const error = new EventServerConnectionTimeoutError(
            "Unable to connect to event server within timeout."
          );
          reject(error);
        }, timeout * 1000);
      }
    });

    const onPublish = onConnected.then(() => {
      if (onReply) {
        this._replyCallbacks[eventId] = onReply;
      }

      this.logger.debug("Publishing event.", eventData);
      if (!this._socketIo) {
        throw new EventServerPublishError(
          "Unable to publish event, not connected to server."
        );
      }
      this._socketIo.emit("ftrack.event", eventData);
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
  publishAndWaitForReply(
    event: Event,
    { timeout = 30 }: { timeout: number }
  ): Promise<unknown> {
    const eventId = event.getData().id;
    const response = new Promise((resolve, reject) => {
      const onReply: EventCallback = (replyEvent) => {
        resolve(replyEvent);
        this._removeReplyCallback(eventId);
      };
      this.publish(event, { timeout, onReply });

      if (timeout) {
        setTimeout(() => {
          const error = new EventServerReplyTimeoutError(
            "No reply event received within timeout."
          );
          reject(error);
          this._removeReplyCallback(eventId);
        }, timeout * 1000);
      }
    });

    return response;
  }

  _removeReplyCallback(eventId: string) {
    if (this._replyCallbacks[eventId]) {
      delete this._replyCallbacks[eventId];
    }
  }

  /**
   * Run *callback* if event hub is connected to server.
   * @param  {Function} callback
   */
  _runWhenConnected(callback: ConnectionCallback) {
    if (!this.isConnected()) {
      this.logger.debug("Event hub is not connected, event is delayed.");
      this._unsentEvents.push(callback);

      if (this._socketIo) {
        // Force reconnect socket if not automatically reconnected. This
        // happens for example in Adobe After Effects when rendering a
        // sequence takes longer than ~30s and the JS thread is blocked.
        this._socketIo.socket.reconnect();
      }
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
  subscribe(
    subscription: string,
    callback: EventCallback,
    metadata?: SubscriberMetadata
  ): string {
    const subscriber = this._addSubscriber(subscription, callback, metadata);
    this._notifyServerAboutSubscriber(subscriber);
    return subscriber.metadata.id;
  }

  /**
   * Unsubscribe from *subscription* events.
   *
   * @param  {String}   identifier  Subscriber ID returned from subscribe method.
   * @return {Boolean}              True if a subscriber was removed, false otherwise
   */
  unsubscribe(identifier: string): boolean {
    let hasFoundSubscriberToRemove = false;
    this._subscribers = this._subscribers.filter((subscriber) => {
      if (subscriber.metadata.id === identifier) {
        this._notifyServerAboutUnsubscribe(subscriber.metadata);
        hasFoundSubscriberToRemove = true;
        return false;
      }
      return true;
    });

    return hasFoundSubscriberToRemove;
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
  _getExpressionTopic(subscription: string) {
    // retreive the value of a topic on the format "topic=value"
    const regex = new RegExp("^topic[ ]?=[ '\"]?([\\w-,./*@+]+)['\"]?$");
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
  _addSubscriber(
    subscription: string,
    callback: EventCallback,
    metadata: SubscriberMetadata = {
      id: uuidV4(),
    }
  ) {
    // Ensure subscription is on supported format.
    // TODO: Remove once subscription parsing is supported.
    this._getExpressionTopic(subscription);

    if (!metadata.id) {
      metadata.id = uuidV4();
    }

    // Check subscriber not already subscribed.
    const existingSubscriber = this.getSubscriberByIdentifier(metadata.id);

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
  _notifyServerAboutSubscriber(subscriber: Subscriber) {
    const subscribeEvent = new Event("ftrack.meta.subscribe", {
      subscriber: subscriber.metadata,
      subscription: subscriber.subscription,
    });
    this.publish(subscribeEvent);
  }

  _notifyServerAboutUnsubscribe(subscriber: SubscriberMetadata) {
    const unsubscribeEvent = new Event("ftrack.meta.unsubscribe", {
      subscriber,
    });
    this.publish(unsubscribeEvent);
  }

  /**
   * Return subscriber with matching *identifier*.
   *
   * Return null if no subscriber with *identifier* found.
   *
   * @param  {String} identifier
   * @return {Subscriber|null}
   */
  getSubscriberByIdentifier(identifier: string): Subscriber | null {
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
   * @param  {Object} eventPayload
   * @return {Boolean}
   */
  _IsSubscriberInterestedIn(
    subscriber: Subscriber,
    eventPayload: EventPayload
  ) {
    const topic = this._getExpressionTopic(subscriber.subscription);
    if (topic === eventPayload.topic) {
      return true;
    }
    return false;
  }

  /**
   * Handle Events.
   * @param  {Object} eventPayload   Event payload
   */
  _handle(eventPayload: EventPayload) {
    this.logger.debug("Event received", eventPayload);

    for (const subscriber of this._subscribers) {
      // TODO: Parse event target and check that it matches subscriber.

      // TODO: Support full expression format as used in Python.
      if (!this._IsSubscriberInterestedIn(subscriber, eventPayload)) {
        continue;
      }

      let response = null;
      try {
        response = subscriber.callback(eventPayload);
      } catch (error) {
        this.logger.error(
          "Error calling subscriber for event.",
          error,
          subscriber,
          eventPayload
        );
      }

      // Publish reply if response isn't null or undefined.
      if (response != null) {
        this.publishReply(eventPayload, response, subscriber.metadata);
      }
    }
  }

  /**
   * Handle reply event.
   * @param  {Object} eventPayload  Event payload
   */
  _handleReply(eventPayload: EventPayload) {
    this.logger.debug("Reply received", eventPayload);
    const onReplyCallback = !eventPayload.inReplyToEvent
      ? null
      : this._replyCallbacks[eventPayload.inReplyToEvent];
    if (onReplyCallback) {
      onReplyCallback(eventPayload);
    }
  }

  /**
   * Publish reply event.
   * @param  {Object} sourceEventPayload Source event payload
   * @param  {Object} data        Response event data
   * @param  {Object} [source]    Response event source information
   */
  publishReply(
    sourceEventPayload: EventPayload,
    data: Data,
    source: Data | null = null
  ): Promise<string> {
    const replyEvent = new Event("ftrack.meta.reply", {
      ...data,
      target: `id=${sourceEventPayload.source.id}`,
      inReplyToEvent: sourceEventPayload.id,
      source: source ?? data.source,
    });

    return this.publish(replyEvent);
  }
}
