// :copyright: Copyright (c) 2023 ftrack
import WebSocket from "isomorphic-ws";
import { Event } from "./event.js";
export const PACKET_TYPES = {
  disconnect: "0",
  connect: "1",
  heartbeat: "2",
  message: "3",
  json: "4",
  event: "5",
  acknowledge: "6",
  error: "7",
} as const;

interface EventHandlers {
  [eventName: string]: ((eventData: Event["_data"]) => void)[];
}

interface Payload {
  name: string;
  args: Event["_data"][];
}

/**
 * SimpleSocketIOClient is a lightweight WebSocket client that simplifies communication
 * with a server using a simplified version of the Socket.IO 0.9 protocol. It handles connection,
 * event emission, event handling, and automatic reconnection.
 *
 * Example usage:
 * ```
 * const client = new SimpleSocketIOClient(serverUrl, apiUser, apiKey);
 *
 * client.on("connect", () => {
 *   console.log("Connected!");
 *   client.emit("my-event", { data: "Hello, world!" });
 * });
 *
 * client.on("my-event", (eventData) => {
 *   console.log("Received response:", eventData);
 * });
 * ```
 */
export default class SimpleSocketIOClient {
  private static instances: Map<string, SimpleSocketIOClient> = new Map();
  private webSocket: WebSocket;
  private handlers: EventHandlers = {};
  private reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
  private heartbeatTimeout: ReturnType<typeof setInterval> | undefined;
  private serverUrl: string;
  private webSocketUrl: string;
  private heartbeatTimeoutMs: number;
  private query: string;
  private apiUser: string;
  private apiKey: string;
  private sessionId?: string;
  private packetQueue: string[] = [];
  private reconnectionAttempts: number = 0;

  // Added socket object with connected, open reconnect and transport properties to match current API
  // The old socket-io client uses both a connected and open property that are interchangeable
  // especially since we now don't use any fallback for websocket. To not break existing code
  // we add open as a getter to the connected property
  public socket: {
    connected: boolean;
    reconnect: () => void;
    transport: { websocket: WebSocket | null };
    get open(): boolean;
  } = {
    connected: false,
    reconnect: this.reconnect.bind(this),
    transport: { websocket: null },
    get open() {
      return this.connected;
    },
  };

  /**
   * Connect to a websocket server, or return the existing instance if one already exists.
   * @param serverUrl - The server URL.
   * @param apiUser - The API user.
   * @param apiKey - The API key.
   * @param heartbeatTimeoutMs - The heartbeat timeout in milliseconds. Defaults to 15000
   * @param forceNew - If true, a new instance will be created even if one already exists. Mostly used for tests
   */
  public static connect(
    serverUrl: string,
    apiUser: string,
    apiKey: string,
    heartbeatTimeoutMs: number = 15000,
    forceNew: boolean = false
  ): SimpleSocketIOClient {
    const key = `${serverUrl}_${apiUser}_${apiKey}`;
    let instance = this.instances.get(key);

    if (!instance || forceNew) {
      instance = new SimpleSocketIOClient(
        serverUrl,
        apiUser,
        apiKey,
        heartbeatTimeoutMs
      );
      this.instances.set(key, instance);
    }

    return instance;
  }

  /**
   * Constructs a new SimpleSocketIOClient instance.
   * @param serverUrl - The server URL.
   * @param apiUser - The API user.
   * @param apiKey - The API key.
   * @param heartbeatTimeoutMs - The heartbeat timeout in milliseconds. Defaults to 15000
   */
  private constructor(
    serverUrl: string,
    apiUser: string,
    apiKey: string,
    heartbeatTimeoutMs: number = 15000
  ) {
    // Convert the http(s) URL to ws(s) URL
    const WebSocketUrl = serverUrl.replace(/^(http)/, "ws");
    this.serverUrl = serverUrl;
    this.webSocketUrl = WebSocketUrl;
    this.query = new URLSearchParams({
      api_user: apiUser,
      api_key: apiKey,
    }).toString();
    this.heartbeatTimeoutMs = heartbeatTimeoutMs;
    this.apiUser = apiUser;
    this.apiKey = apiKey;
    this.initializeWebSocket();
  }
  /**
   * Fetches the session ID from the ftrack server.
   * @private
   * @returns A promise that resolves to the session ID.
   */
  private async fetchSessionId(): Promise<string> {
    try {
      const url = new URL(`${this.serverUrl}/socket.io/1/`);
      url.searchParams.append("api_user", this.apiUser);
      url.searchParams.append("api_key", this.apiKey);

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Error fetching session ID: ${response.statusText}`);
      }

      const responseText = await response.text();
      const sessionId = responseText.split(":")[0];
      this.sessionId = sessionId;
      return sessionId;
    } catch (error) {
      console.error("Error fetching session ID:", error);
      throw error;
    }
  }
  /**
   *Initializes the WebSocket connection.
   * @private
   * @returns A promise that waits for the session ID and resolves when the
   * initial event listeners have been added.
   */
  private async initializeWebSocket(): Promise<void> {
    const sessionId = this.sessionId ?? (await this.fetchSessionId());
    const urlWithQueryAndSession = `${this.webSocketUrl}/socket.io/1/websocket/${sessionId}?${this.query}`;
    this.webSocket = new WebSocket(urlWithQueryAndSession);
    // Set transport.websocket property as a public alias of the websocket
    this.socket.transport.websocket = this.webSocket;
    this.addInitialEventListeners(this.webSocket);
  }

  /**
   * Adds initial event listeners to the WebSocket
   * @private
   */
  private addInitialEventListeners(WebSocket: WebSocket): void {
    WebSocket.onmessage = this.handleMessage.bind(this);
    WebSocket.onopen = this.handleOpen.bind(this);
    WebSocket.onclose = this.handleClose.bind(this);
    WebSocket.onerror = this.handleError.bind(this);
  }
  /**
   * Handles WebSocket errors
   * @private
   */
  private handleError(event: Event): void {
    this.handleClose();
    console.error("WebSocket error:", event);
  }
  /**
   * Handles WebSocket messages
   * @private
   */
  private handleMessage(event: MessageEvent): void {
    const [packetType, data] = event.data.split(/:::?/);
    if (packetType === PACKET_TYPES.event) {
      const parsedData = JSON.parse(data) as Payload;
      const { name, args } = parsedData;
      this.handleEvent(name, args[0]);
      return;
    }
    if (packetType === PACKET_TYPES.heartbeat) {
      // Respond to server heartbeat with a heartbeat
      this.webSocket?.send(`${PACKET_TYPES.heartbeat}::`);
      this.resetHeartbeatCheck();
      this.flushPacketQueue();
      return;
    }
    if (packetType === PACKET_TYPES.error) {
      console.log("WebSocket message error: ", event);
      this.handleClose();
      return;
    }
  }
  /**
   * Handles WebSocket open event
   * @private
   */
  private handleOpen(): void {
    this.startHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.reconnectionAttempts = 0; // Reset reconnection attempts
    this.handleEvent("connect", {});
    this.flushPacketQueue();
    // Set connected property to true
    this.socket.connected = true;
  }
  /**
   * Handles WebSocket close event
   * @private
   */
  private handleClose(): void {
    this.stopHeartbeat();
    this.reconnect();
    // Set connected property to false
    this.socket.connected = false;
  }
  /**
   * Calls all callbacks for the given eventName with the given eventData.
   * @private
   * @param eventName - The event name.
   * @param eventData - The event data.
   */
  private handleEvent(eventName: string, eventData?: any): void {
    this.handlers[eventName]?.forEach((callback) => callback(eventData));
  }
  /**
   * Sets up event callbacks for a given eventName.
   * @public
   * @param eventName - The event name.
   * @param eventCallback - The event callback.
   */
  public on(eventName: string, eventCallback: (eventData: any) => void): void {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(eventCallback);
  }
  /**
   * Removes event callbacks for a given eventName. An optional eventCallback
   * can be passed to remove that specific callback.
   * @private
   * @param eventName - The event name.
   * @param eventCallback - The event callback.
   */
  public off(
    eventName: string,
    eventCallback?: (eventData: any) => void
  ): void {
    if (!eventCallback) {
      delete this.handlers[eventName];
    } else {
      this.handlers[eventName] = this.handlers[eventName]?.filter(
        (callback) => callback !== eventCallback
      );
    }
  }
  /**
   * Emits an event with the given eventName and eventData.
   * If the WebSocket is not open, the event is queued and sent
   * when the WebSocket is open.
   * @public
   * @param eventName - The event name.
   * @param eventData - The event data.
   */
  public emit(eventName: string, eventData?: object): void {
    const payload = {
      name: eventName,
      args: [eventData],
    };
    const dataString = eventData ? `:::${JSON.stringify(payload)}` : "";
    const packet = `${PACKET_TYPES.event}${dataString}`;

    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.webSocket.send(packet);
    } else {
      this.packetQueue.push(packet);
    }
  }
  /**
   * Send the queued packets to the server
   * @private
   */
  private flushPacketQueue(): void {
    while (this.packetQueue.length > 0) {
      const packet = this.packetQueue.shift();
      if (packet && this.webSocket) {
        this.webSocket.send(packet);
      }
    }
  }
  /**
   * Sets a timeout to wait for a hearbeat from the server
   * before trying to reconnect
   * @private
   */
  private resetHeartbeatCheck(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = undefined;
    }
    this.heartbeatTimeout = setTimeout(() => {
      this.reconnect();
    }, this.heartbeatTimeoutMs);
  }

  /**
   * Starts expecting heartbeats from the server
   * @private
   */
  private startHeartbeat(): void {
    this.resetHeartbeatCheck();
  }

  /**
   * Stops sending heartbeats to the server
   * @private
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = undefined;
    }
  }
  /**
   * Returns whether the WebSocket is connected or not.
   * Different from the socket.connected property, which is set
   * manually. This uses the readyState from the WebSocket.
   * @public
   * @returns - True if the WebSocket is open, false otherwise.
   */
  public isConnected(): boolean {
    return this.webSocket?.readyState === WebSocket.OPEN;
  }
  /**
   * Schedules a reconnect attempt. The delay is calculated
   * using the reconnectionDelay and reconnectionDelayMax options.
   * It is then randomized to prevent multiple clients from reconnecting at the same time.
   * @public
   * @param reconnectionDelay - The delay in milliseconds before first attempting to reconnect. Defaults to 1000.
   * @param reconnectionDelayMax - The maximum delay in milliseconds before attempting to reconnect. Defaults to 10000.
   */
  public reconnect(
    reconnectionDelay: number = 1000,
    reconnectionDelayMax: number = 10000
  ): void {
    // Check if already connected
    if (this.isConnected()) {
      this.emit("reconnect");
      return;
    }

    // Calculate delay for reconnect
    const delay = Math.min(
      reconnectionDelay * Math.pow(2, this.reconnectionAttempts),
      reconnectionDelayMax
    );
    const randomizedDelay = Math.round(delay * (1 + 0.5 * Math.random()));

    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.attemptReconnect();
      }, randomizedDelay);
    }
  }
  /**
   * Attempt a reconnect attempt.
   * @private
   * @param randomizedDelay
   */
  private attemptReconnect(): void {
    this.reconnectionAttempts++;
    this.initializeWebSocket();
    this.reconnectTimeout = undefined;
    this.reconnect();
  }
  /**
   * Allows users to manually disconnect the WebSocket connection and stop all reconnection attempts
   * @public
   */

  public disconnect(): void {
    this.stopHeartbeat();
    this.socket.connected = false;
    this.webSocket?.close();
    this.webSocket = undefined;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }
}
