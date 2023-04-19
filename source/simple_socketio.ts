// :copyright: Copyright (c) 2023 ftrack
import WebSocket from "isomorphic-ws";
import type { Event } from "./event";
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
  private ws: WebSocket;
  private handlers: EventHandlers;
  private reconnectTimeout: ReturnType<typeof setInterval> | undefined;
  private heartbeatInterval: ReturnType<typeof setInterval> | undefined;
  private serverUrl: string;
  private wsUrl: string;
  private heartbeatIntervalMs: number;
  private query: string;
  private apiUser: string;
  private apiKey: string;
  private sessionId?: string;
  private packetQueue: string[] = [];

  // Added socket object with connected, reconnect and transport properties to match current API
  public socket: {
    connected: boolean;
    reconnect: () => void;
    transport: WebSocket;
  };
  /**
   * Constructs a new SimpleSocketIOClient instance.
   * @param serverUrl - The server URL.
   * @param apiUser - The API user.
   * @param apiKey - The API key.
   * @param heartbeatIntervalMs - The heartbeat interval in milliseconds. Defaults to 10000
   */
  constructor(
    serverUrl: string,
    apiUser: string,
    apiKey: string,
    heartbeatIntervalMs: number = 10000
  ) {
    // Convert the http(s) URL to ws(s) URL
    const wsUrl = serverUrl.replace(/^(http)/, "ws");
    this.serverUrl = serverUrl;
    this.wsUrl = wsUrl;
    this.query = new URLSearchParams({
      api_user: apiUser,
      api_key: apiKey,
    }).toString();
    this.handlers = {};
    this.heartbeatIntervalMs = heartbeatIntervalMs;
    this.apiUser = apiUser;
    this.apiKey = apiKey;
    this.socket = {
      connected: false,
      reconnect: this.reconnect.bind(this),
      transport: null,
    };
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(url, {
        headers: {
          "ftrack-api-user": this.apiUser,
          "ftrack-api-key": this.apiKey,
        },
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
    const urlWithQueryAndSession = `${this.wsUrl}/socket.io/1/websocket/${sessionId}?${this.query}`;
    this.ws = new WebSocket(urlWithQueryAndSession);
    // Set transport property as a public alias of the websocket
    this.socket.transport = this.ws;
    this.addInitialEventListeners(this.ws);
  }

  /**
   * Adds initial event listeners to the WebSocket
   * @private
   */
  private addInitialEventListeners(ws: WebSocket): void {
    ws.addEventListener("message", this.handleMessage.bind(this));
    ws.addEventListener("open", this.handleOpen.bind(this));
    ws.addEventListener("close", this.handleClose.bind(this));
    ws.addEventListener("error", this.handleError.bind(this));
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
      this.ws?.send(`${PACKET_TYPES.heartbeat}::`);
      this.flushPacketQueue();
      return;
    }
    if (packetType === PACKET_TYPES.error) {
      // Respond to server heartbeat with a heartbeat
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
    this.scheduleReconnect();
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
   * @private
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
   * Emits an event with the given eventName and eventData.
   * If the WebSocket is not open, the event is queued and sent
   * when the WebSocket is open.
   * @public
   * @param eventName - The event name.
   * @param eventData - The event data.
   */
  public emit(eventName: string, eventData: Event["_data"]): void {
    const payload = {
      name: eventName,
      args: [eventData],
    };
    const dataString = eventData ? `:::${JSON.stringify(payload)}` : "";
    const packet = `${PACKET_TYPES.event}${dataString}`;

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(packet);
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
      if (packet && this.ws) {
        this.ws.send(packet);
      }
    }
  }
  /**
   * Starts sending heartbeats to the server to keep the connection alive
   * @private
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.ws?.send(`${PACKET_TYPES.heartbeat}::`);
    }, this.heartbeatIntervalMs);
  }
  /**
   * Stops sending heartbeats to the server
   * @private
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
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
    return this.ws?.readyState === WebSocket.OPEN;
  }
  /**
   *
   * Reconnects to the server if the connection is lost using the same session ID.
   * @public
   */
  public reconnect(): void {
    if (this.socket.connected) {
      this.ws?.close();
    }
    this.initializeWebSocket();
  }
  /**
   * Schedules a reconnect attempt after a specified delay.
   * @private
   * @param reconnectDelayMs - The delay in milliseconds before attempting to reconnect. Defaults to 5000.
   */
  private scheduleReconnect(reconnectDelayMs: number = 5000): void {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnect();
      }, reconnectDelayMs);
    }
  }
}
