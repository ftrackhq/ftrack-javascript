// :copyright: Copyright (c) 2023 ftrack
import { test, vi } from "vitest";
import SimpleSocketIOClient, { PACKET_TYPES } from "../source/simple_socketio";
const credentials = {
  serverUrl: "http://ftrack.test",
  apiUser: "testuser",
  apiKey: "testkey",
};

// Check if the class properties are correctly initialized in the constructor
test("SimpleSocketIOClient: constructor initializes properties correctly", async () => {
  // Set up test data
  const heartbeatIntervalMs = 5000;

  // Create an instance of SimpleSocketIOClient
  const client = new SimpleSocketIOClient(
    credentials.serverUrl,
    credentials.apiUser,
    credentials.apiKey,
    heartbeatIntervalMs
  );

  // Assertions
  expect(client.serverUrl).toBe(credentials.serverUrl);
  expect(client.wsUrl).toBe(credentials.serverUrl.replace(/^(http)/, "ws"));
  expect(client.query).toMatch(credentials.apiUser);
  expect(client.query).toMatch(credentials.apiKey);
  expect(client.handlers).toEqual({});
  expect(client.heartbeatIntervalMs).toBe(heartbeatIntervalMs);
  expect(client.apiUser).toBe(credentials.apiUser);
  expect(client.apiKey).toBe(credentials.apiKey);
  expect(client.socket).toMatchObject({
    connected: false,
    transport: null,
  });
});
// Test the `fetchSessionId` method by using the mock server and checking if the session ID is fetched correctly
test("fetchSessionId method should fetch session ID correctly", async () => {
  // Create an instance of SimpleSocketIOClient
  const client = new SimpleSocketIOClient(
    credentials.serverUrl,
    credentials.apiUser,
    credentials.apiKey
  );

  // Call the fetchSessionId method (it's private, so we use Object.getOwnPropertyDescriptor to access it)
  // Check if there is a better way of doing this

  const fetchSessionIdDescriptor = Object.getOwnPropertyDescriptor(
    SimpleSocketIOClient.prototype,
    "fetchSessionId"
  );
  const fetchSessionId = fetchSessionIdDescriptor.value;
  const sessionId = await fetchSessionId.call(client);

  // Check if the session ID is fetched correctly
  expect(sessionId).toBe("1234567890");
});

test("constructor initializes custom heartbeatIntervalMs correctly", () => {
  const client = new SimpleSocketIOClient(
    credentials.serverUrl,
    credentials.apiUser,
    credentials.apiKey,
    1990
  );
  expect(client.heartbeatIntervalMs).toBe(1990);
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
  const client = new SimpleSocketIOClient(
    credentials.serverUrl,
    credentials.apiUser,
    credentials.apiKey
  );
  const callback = () => {};

  client.on("testEvent", callback);
  expect(client.handlers["testEvent"]).toContain(callback);
});

test("constructor initializes properties correctly with HTTPS URL", () => {
  const client = new SimpleSocketIOClient(
    "https://ftrack.test",
    credentials.apiUser,
    credentials.apiKey
  );
  expect(client.serverUrl).toBe("https://ftrack.test");
  expect(client.wsUrl).toBe("wss://ftrack.test");
});
test("emit method correctly sends event to server", () => {
  const client = new SimpleSocketIOClient(
    credentials.serverUrl,
    credentials.apiUser,
    credentials.apiKey
  );

  // Mock the send method of the WebSocket
  const sendMock = vi.fn();
  client.ws = { send: sendMock };

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
  expect(sendMock).toHaveBeenCalledWith(
    `${PACKET_TYPES.event}${expectedDataString}`
  );
});
test("handleError method correctly handles WebSocket errors and calls handleClose method", () => {
  // Create an instance of SimpleSocketIOClient
  const client = new SimpleSocketIOClient(
    credentials.serverUrl,
    credentials.apiUser,
    credentials.apiKey
  );

  // Mock WebSocket object
  client.ws = {
    addEventListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
  };
  vi.spyOn(client, "handleClose");
  vi.spyOn(global.console, "error");

  // Call handleError method with mock event
  const mockEvent = { type: "error" };
  client.handleError(mockEvent);

  // Assertions
  expect(client.handleClose).toHaveBeenCalledTimes(1);
  expect(console.error).toHaveBeenCalledWith("WebSocket error:", mockEvent);
});

test("reconnect method runs the ws close method and then initialises websocket again", async () => {
  const client = new SimpleSocketIOClient(
    credentials.serverUrl,
    credentials.apiUser,
    credentials.apiKey
  );

  // Spy on the initializeWebSocket method
  vi.spyOn(client, "initializeWebSocket");

  // Initialize the WebSocket and set the connected property to true
  await client.initializeWebSocket();
  client.socket.connected = true;

  // Mock the WebSocket close method to check if it is called
  const closeMock = vi.fn();
  client.ws.close = closeMock;

  // Call the reconnect method
  client.reconnect();

  // Check that closemock was called and that the initializeWebSocket method was called again
  expect(closeMock).toHaveBeenCalledTimes(1);
  expect(client.initializeWebSocket).toHaveBeenCalledTimes(2);
});
