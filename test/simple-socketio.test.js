// Import the required dependencies
import { test } from "vitest";
import { mockedServer, closeServer as closeWsServer } from "./ws_server";
import SimpleSocketIOClient from "../source/simple_socketio";
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

describe("WebSocket tests", () => {
  let client;
  afterEach(() => {
    closeWsServer(); // Close the server after each test
  });
  test("Client should receive a custom event", async () => {
    const eventName = "testEvent";
    const eventData = { key: "value" };

    // Use a single Promise to handle both 'connect' and the custom event
    await new Promise((resolve) => {
      client = new SimpleSocketIOClient(
        credentials.serverUrl,
        credentials.apiUser,
        credentials.apiKey
      );
      console.log("client", client);
      client.on(eventName, (data) => {
        expect(data).toEqual(eventData);
        resolve();
      });
      client.on("connect", () => {
        const serverSocket = mockedServer.clients[0];
        console.log("serverSocket", serverSocket);
        serverSocket.sendEvent(eventName, eventData);
      });
    });
  });
});
