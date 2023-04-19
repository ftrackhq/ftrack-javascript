// :copyright: Copyright (c) 2023 ftrack
import { test, vi } from "vitest";
import SimpleSocketIOClient, { PACKET_TYPES } from "../source/simple_socketio";
const credentials = {
  serverUrl: "http://ftrack.test",
  apiUser: "testuser",
  apiKey: "testkey",
};
function createWebSocketMock() {
  return {
    addEventListener: vi.fn(),
    send: vi.fn(),
  };
}
function createClient(options) {
  return new SimpleSocketIOClient(
    options.serverUrl || credentials.serverUrl,
    options.apiUser || credentials.apiUser,
    options.apiKey || credentials.apiKey,
    options.heartbeatIntervalMs || undefined
  );
}

describe("Tests using SimpleSocketIOClient", () => {
  let client;

  beforeEach(() => {
    client = createClient({});
  });
  afterEach(() => {
    client = undefined;
  });

  test("SimpleSocketIOClient initializes properties correctly", async () => {
    // Assertions
    expect(client.serverUrl).toBe(credentials.serverUrl);
    expect(client.wsUrl).toBe(credentials.serverUrl.replace(/^(http)/, "ws"));
    expect(client.query).toMatch(credentials.apiUser);
    expect(client.query).toMatch(credentials.apiKey);
    expect(client.handlers).toEqual({});
    expect(client.apiUser).toBe(credentials.apiUser);
    expect(client.apiKey).toBe(credentials.apiKey);
    expect(client.socket).toMatchObject({
      connected: false,
      transport: null,
    });
  });
  test("initializeWebSocket should set the fetched session ID correctly", async () => {
    // Call the initializeWebSocket method
    await client.initializeWebSocket();

    // Check if the session ID is fetched correctly
    expect(client.sessionId).toBe("1234567890");
  });

  test("SimpleSocketIOClient initializes custom heartbeatIntervalMs correctly", () => {
    const heartbeatClient = createClient({
      heartbeatIntervalMs: 1990,
    });
    expect(heartbeatClient.heartbeatIntervalMs).toBe(1990);
  });

  test.skip("isConnected returns false when WebSocket is not initialized", () => {
    // TODO: Figure out how to handle error throw testing.

    let connected;
    try {
      const client = new SimpleSocketIOClient(
        credentials.serverUrl,
        credentials.apiUser,
        "INVALID_API_KEY"
      );
      connected = client.isConnected();
    } catch (error) {
      connected = false;
    }
    expect(connected).toBe(false);
  });

  test("on method registers event callback correctly", () => {
    const callback = () => {};

    client.on("testEvent", callback);
    expect(client.handlers["testEvent"]).toContain(callback);
  });

  test("SimpleSocketIOClient initializes properties correctly with HTTPS URL", () => {
    const httpsClient = createClient({ serverUrl: "https://ftrack.test" });
    expect(httpsClient.serverUrl).toBe("https://ftrack.test");
    expect(httpsClient.wsUrl).toBe("wss://ftrack.test");
  });
  test("emit method correctly sends event to server", () => {
    client.ws = createWebSocketMock();

    const eventName = "testEvent";
    const eventData = { foo: "bar" };

    // Call the emit method
    client.emit(eventName, eventData);

    // Check that the correct payload is sent to the server
    const expectedPayload = {
      name: eventName,
      args: [eventData],
    };
    const expectedDataString = `:::${JSON.stringify(expectedPayload)}`;
    expect(client.ws.send).toHaveBeenCalledWith(
      `${PACKET_TYPES.event}${expectedDataString}`
    );
  });
  test("handleError method correctly handles WebSocket errors and calls handleClose method", () => {
    client.ws = createWebSocketMock();
    vi.spyOn(client, "handleClose");
    vi.spyOn(global.console, "error");

    // Call handleError method with mock event
    const mockEvent = { type: "error" };
    client.handleError(mockEvent);

    expect(client.handleClose).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith("WebSocket error:", mockEvent);
  });

  test("reconnect method runs the ws close method and then initialises websocket again", async () => {
    vi.spyOn(client, "initializeWebSocket");

    // Initialize the WebSocket and set the connected property to true
    await client.initializeWebSocket();
    client.socket.connected = true;

    // Create a mock WebSocket with a spied close method
    const closeMock = vi.fn();
    client.ws.close = closeMock;

    // Call the reconnect method
    client.reconnect();

    // Check that closemock was called and that the initializeWebSocket method was called again
    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(client.initializeWebSocket).toHaveBeenCalledTimes(2);
  });
});
