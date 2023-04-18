// :copyright: Copyright (c) 2023 ftrack
import WebSocket from "isomorphic-ws";
import type { Event } from "./event";
const PACKET_TYPES = {
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

  // Added socket object with connected, reconnect and transport properties to match current API
  public socket: {
    connected: boolean;
    reconnect: () => void;
    transport: WebSocket;
  };

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
  }
  // Fetch the session ID from the ftrack server
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
  private async initializeWebSocket(): Promise<void> {
    const sessionId = this.sessionId ?? (await this.fetchSessionId());
    const urlWithQueryAndSession = `${this.wsUrl}/socket.io/1/websocket/${sessionId}?${this.query}`;
    this.ws = new WebSocket(urlWithQueryAndSession);
    // Set transport property as a public alias of the websocket
    this.socket.transport = this.ws;
    this.addInitialEventListeners();
  }

  private addInitialEventListeners(): void {
    this.ws.addEventListener("message", this.handleMessage.bind(this));
    this.ws.addEventListener("open", this.handleOpen.bind(this));
    this.ws.addEventListener("close", this.handleClose.bind(this));
    this.ws.addEventListener("error", this.handleError.bind(this));
  }

  private handleError(event: Event): void {
    this.handleClose();
    console.error("WebSocket error:", event);
  }
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
      this.ws.send(`${PACKET_TYPES.heartbeat}::`);
      return;
    }
    if (packetType === PACKET_TYPES.error) {
      // Respond to server heartbeat with a heartbeat
      console.log("WebSocket message error: ", event);
      this.handleClose();
      return;
    }
  }
  private handleOpen(): void {
    this.startHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.handleEvent("connect", {});
    // Set connected property to true
    this.socket.connected = true;
  }

  private handleClose(): void {
    this.stopHeartbeat();
    this.scheduleReconnect();
    // Set connected property to false
    this.socket.connected = false;
  }
  private handleEvent(eventName: string, eventData?: any): void {
    this.handlers[eventName]?.forEach((callback) => callback(eventData));
  }
  // Setup event callbacks for a given eventName
  public on(eventName: string, eventCallback: (eventData: any) => void): void {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(eventCallback);
  }
  // Emit an event with the given eventName and eventData
  public emit(eventName: string, eventData: Event["_data"]): void {
    const payload = {
      name: eventName,
      args: [eventData],
    };
    const dataString = eventData ? `:::${JSON.stringify(payload)}` : "";
    this.ws.send(`${PACKET_TYPES.event}${dataString}`);
  }
  // Heartbeat methods, to tell the server to keep the connection alive
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.ws.send(`${PACKET_TYPES.heartbeat}::`);
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  // Reconnect methods, to reconnect to the server if the connection is lost using the same session ID
  public reconnect(): void {
    if (this.socket.connected) {
      this.ws.close();
    }
    this.initializeWebSocket();
  }
  private scheduleReconnect(reconnectDelayMs: number = 5000): void {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnect();
      }, reconnectDelayMs);
    }
  }
}
