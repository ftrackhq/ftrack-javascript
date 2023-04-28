// :copyright: Copyright (c) 2023 ftrack
import { describe, test, vi } from "vitest";
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
    options.heartbeatTimeoutMs || undefined
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

  test("SimpleSocketIOClient initializes properties correctly", () => {
    // Assertions
    expect(client.serverUrl).toBe(credentials.serverUrl);
    expect(client.webSocketUrl).toBe(
      credentials.serverUrl.replace(/^(http)/, "ws")
    );
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
  test("fetchSessionId should set the fetched session ID correctly", async () => {
    // Call the initializeWebSocket method
    await client.fetchSessionId();

    // Check if the session ID is fetched correctly
    expect(client.sessionId).toBe("1234567890");
  });

  test("SimpleSocketIOClient initializes custom heartbeatTimeoutMs correctly", () => {
    const heartbeatClient = createClient({
      heartbeatTimeoutMs: 1990,
    });
    expect(heartbeatClient.heartbeatTimeoutMs).toBe(1990);
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
  test("off method removes event callback correctly", async ({ expect }) => {
    const callback = () => {};

    client.on("testEvent", callback);
    client.off("testEvent", callback);

    // Check if the event listener has been removed
    expect(client.handlers["test-event"]).not.toContain(callback);
  });
  test("Off method removes only the callback given", async ({ expect }) => {
    const callback = () => {};
    const callback2 = () => {};
    client.on("testEvent", callback);
    client.on("testEvent", callback2);
    client.off("testEvent", callback);

    expect(client.handlers["test-event"]).toContain(callback2);
    expect(client.handlers["test-event"]).not.toContain(callback);
  });
  test("Off method removes all callbacks when only name given", async ({
    expect,
  }) => {
    const callback = () => {};
    const callback2 = () => {};
    client.on("testEvent", callback);
    client.on("testEvent", callback2);
    client.off("testEvent");

    expect(client.handlers["test-event"]).not.toContain(callback2);
    expect(client.handlers["test-event"]).not.toContain(callback);
  });
  test("SimpleSocketIOClient initializes properties correctly with HTTPS URL", () => {
    const httpsClient = createClient({ serverUrl: "https://ftrack.test" });
    expect(httpsClient.serverUrl).toBe("https://ftrack.test");
    expect(httpsClient.webSocketUrl).toBe("wss://ftrack.test");
  });
  test("emit method correctly sends event to server", () => {
    client.webSocket = createWebSocketMock();
    // Set the readyState to OPEN, to simulate an open connection
    client.webSocket.readyState = WebSocket.OPEN;

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
    expect(client.webSocket.send).toHaveBeenCalledWith(
      `${PACKET_TYPES.event}${expectedDataString}`
    );
  });
  test("handleError method correctly handles WebSocket errors and calls handleClose method", () => {
    client.webSocket = createWebSocketMock();
    vi.spyOn(client, "handleClose");
    vi.spyOn(global.console, "error");

    // Call handleError method with mock event
    const mockEvent = { type: "error" };
    client.handleError(mockEvent);

    expect(client.handleClose).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith("WebSocket error:", mockEvent);
  });
  describe("handleMessage", () => {
    test("handleMessage correctly handles event packet type", () => {
      const eventName = "testEvent";
      const eventData = { foo: "bar" };
      const packetData = JSON.stringify({ name: eventName, args: [eventData] });

      vi.spyOn(client, "handleEvent");

      client.handleMessage({ data: `${PACKET_TYPES.event}:::${packetData}` });

      expect(client.handleEvent).toHaveBeenCalledWith(eventName, eventData);
    });

    test("handleMessage correctly handles heartbeat packet type", () => {
      client.webSocket = createWebSocketMock();

      client.handleMessage({ data: `${PACKET_TYPES.heartbeat}::` });

      expect(client.webSocket.send).toHaveBeenCalledWith(
        `${PACKET_TYPES.heartbeat}::`
      );
    });

    test("handleMessage correctly handles error packet type", () => {
      vi.spyOn(client, "handleClose");
      vi.spyOn(global.console, "log");

      const errorMsg = "WebSocket message error";
      const mockEvent = { data: `${PACKET_TYPES.error}::${errorMsg}` };

      client.handleMessage(mockEvent);

      expect(console.log).toHaveBeenCalledWith(errorMsg + ": ", mockEvent);
      expect(client.handleClose).toHaveBeenCalledTimes(1);
    });

    //TOOD: What should happen for unknown packet types?
  });
  test("handleEvent method calls the correct callback(s) with the correct eventData", () => {
    const eventName1 = "testEvent1";
    const eventName2 = "testEvent2";
    const eventData1 = { foo: "bar" };
    const eventData2 = { bar: "baz" };

    const callback1 = vi.fn();
    const callback2 = vi.fn();

    client.on(eventName1, callback1);
    client.on(eventName2, callback2);

    // Call the handleEvent method with eventName1 and eventData1
    client.handleEvent(eventName1, eventData1);

    // Check that callback1 was called with eventData1 and callback2 was not called
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenCalledWith(eventData1);
    expect(callback2).toHaveBeenCalledTimes(0);

    // Call the handleEvent method with eventName2 and eventData2
    client.handleEvent(eventName2, eventData2);

    // Check that callback2 was called with eventData2 and callback1 was called only once before
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith(eventData2);
  });
  test("handleOpen method works as expected", () => {
    vi.spyOn(client, "startHeartbeat");
    vi.spyOn(client, "handleEvent");
    // Save original timers
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    // Setup timeout mocks
    const fakeTimeoutId = 12345;
    const setTimeoutMock = vi.fn(() => fakeTimeoutId);
    const clearTimeoutMock = vi.fn();
    global.setTimeout = setTimeoutMock;
    global.clearTimeout = clearTimeoutMock;
    client.reconnectTimeout = setTimeoutMock();

    client.handleOpen();

    // Check that the correct methods were called and that the reconnectTimeout was cleared
    expect(client.startHeartbeat).toHaveBeenCalledTimes(1);
    expect(clearTimeoutMock).toHaveBeenCalledWith(fakeTimeoutId);
    expect(client.reconnectTimeout).toBeUndefined();
    expect(client.handleEvent).toHaveBeenCalledWith("connect", {});
    expect(client.socket.connected).toBe(true);
    // Restore original timers
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });
  describe("handleClose method", () => {
    test("handleClose stops the heartbeat", () => {
      // Spy on stopHeartbeat method
      vi.spyOn(client, "stopHeartbeat");

      // Call handleClose method
      client.handleClose();

      // Check that stopHeartbeat is called
      expect(client.stopHeartbeat).toHaveBeenCalledTimes(1);
    });

    test("handleClose schedules reconnect", () => {
      // Spy on scheduleReconnect method
      vi.spyOn(client, "scheduleReconnect");

      // Call handleClose method
      client.handleClose();

      // Check that scheduleReconnect is called
      expect(client.scheduleReconnect).toHaveBeenCalledTimes(1);
    });

    test("handleClose sets socket.connected property to false", () => {
      // Set connected property to true
      client.socket.connected = true;

      // Call handleClose method
      client.handleClose();

      // Check that connected property is set to false
      expect(client.socket.connected).toBe(false);
    });
  });
  test("resetHeartbeatCheck() properly sets and resets the heartbeatTimeout", async () => {
    vi.useFakeTimers();
    client.resetHeartbeatCheck();

    expect(client.heartbeatTimeout).toBeDefined();

    const initialHeartbeatTimeout = client.heartbeatTimeout;
    vi.advanceTimersByTime(100);

    client.resetHeartbeatCheck();

    expect(client.heartbeatTimeout).toBeDefined();
    expect(client.heartbeatTimeout).not.toBe(initialHeartbeatTimeout);
  });

  test("heartbeatTimeout triggers reconnect() when no heartbeat is received", async () => {
    vi.spyOn(client, "reconnect");
    vi.useFakeTimers();

    client["resetHeartbeatCheck"]();
    vi.advanceTimersByTime(client.heartbeatTimeoutMs + 100);

    expect(client.reconnect).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  test("heartbeatTimeout does not trigger reconnect() when heartbeat is received", async () => {
    vi.spyOn(client, "reconnect");
    vi.useFakeTimers();

    client.resetHeartbeatCheck();
    vi.advanceTimersByTime(client.heartbeatTimeoutMs / 2);

    client.handleMessage({ data: "2::" });
    vi.advanceTimersByTime(client.heartbeatTimeoutMs / 2 + 100);

    expect(client.reconnect).toHaveBeenCalledTimes(0);

    vi.useRealTimers();
  });
  test("Event queue is working", () => {
    client.webSocket = createWebSocketMock();

    // Disconnect the WebSocket to ensure messages are queued
    client.webSocket.readyState = WebSocket.CLOSED;
    const eventName = "testEvent";
    const eventData = { foo: "bar" };

    // Call the emit method
    client.emit(eventName, eventData);

    // Check that the correct payload is sent to the server
    const expectedPayload = {
      name: eventName,
      args: [eventData],
    };

    // Check if the event was queued
    expect(client.packetQueue).toHaveLength(1);
    expect(client.webSocket.send).toHaveBeenCalledTimes(0);
    // Reconnect the WebSocket and ensure the message is sent
    client.webSocket.readyState = WebSocket.OPEN;
    client.handleOpen();

    // Check if the packetQueue is empty and the message was sent
    expect(client.packetQueue).toHaveLength(0);
    const expectedDataString = `:::${JSON.stringify(expectedPayload)}`;
    expect(client.webSocket.send).toHaveBeenCalledWith(
      `${PACKET_TYPES.event}${expectedDataString}`
    );
  });
  describe("Reconnection tests", () => {
    test("reconnect method initialises websocket again", () => {
      client.initializeWebSocket = vi.fn();

      client.reconnect();

      expect(client.initializeWebSocket).toHaveBeenCalledTimes(1);
    });
    test("if reconnecting when connection should be open, first close then initialize again", () => {
      client.initializeWebSocket = vi.fn();

      // Set the connected property to true, simulating a connected socket
      client.socket.connected = true;

      // Create a mock WebSocket with a spied close method
      const closeMock = vi.fn();
      client.webSocket = { close: closeMock };

      // Call the reconnect method
      client.reconnect();

      // Check that closemock and initializeWebSocket method was called
      expect(closeMock).toHaveBeenCalledTimes(1);
      expect(client.initializeWebSocket).toHaveBeenCalledTimes(1);
    });

    test("reconnect method increments attempts count", () => {
      const initialAttempts = client.reconnectionAttempts;

      client.reconnect();

      expect(client.reconnectionAttempts).toBe(initialAttempts + 1);
    });
    test("scheduleReconnect trigger reconnect after delay", () => {
      client.reconnect = vi.fn();

      vi.useFakeTimers();
      client.scheduleReconnect();

      const maxDelay = 1500;

      // Advance the timers to the maxDelay
      vi.advanceTimersByTime(maxDelay);
      expect(client.reconnect).toHaveBeenCalledTimes(1);

      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    test("scheduleReconnect does not trigger reconnect before delay", () => {
      vi.spyOn(client, "reconnect");
      vi.useFakeTimers();

      client.scheduleReconnect();

      // Advance the timers just under the expectedMinDelay
      const expectedMinDelay = 1000;
      vi.advanceTimersByTime(expectedMinDelay - 1);

      // Reconnect should not be called yet
      expect(client.reconnect).toHaveBeenCalledTimes(0);
    });
    test("scheduleReconnect method exponentially increase delay for every attempt", () => {
      vi.useFakeTimers();
      const reconnectMock = vi.fn();
      client.reconnect = reconnectMock;

      const reconnectAttempts = 5;

      for (let i = 1; i <= reconnectAttempts; i++) {
        client.scheduleReconnect();
        const expectedMinDelay = 1000 * Math.pow(2, i - 1);
        const expectedMaxDelay = expectedMinDelay * 1.5;

        vi.advanceTimersByTime(expectedMaxDelay + 1);

        // Reconnect mock should have been called exactly once
        expect(reconnectMock).toHaveBeenCalledTimes(1);

        // Reset the reconnect mock to avoid interference with the next iteration
        reconnectMock.mockReset();
      }
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });
    test("scheduleReconnect method schedules reconnect only once and calls reconnect after specified delay", () => {
      vi.useFakeTimers();

      vi.spyOn(client, "reconnect");

      // Call scheduleReconnect twice to ensure that it only schedules reconnect once
      client.scheduleReconnect();
      client.scheduleReconnect();

      const maxDelay = 1500;

      // Move the clock forward by the maximum remaining reconnect delay and check that reconnect is called exactly once
      vi.advanceTimersByTime(maxDelay);
      expect(client.reconnect).toHaveBeenCalledTimes(1);
      vi.runOnlyPendingTimers();
      vi.useRealTimers(); // Reset timers back to normal behavior
    });
  });

  test("should disconnect and stop reconnection attempts", async ({
    expect,
  }) => {
    // Schedule a reconnection attempt
    client.scheduleReconnect();

    // Connect and then disconnect
    client.socket.connected = true; // Simulate a connected socket
    client.disconnect();

    expect(client.socket.connected).toBe(false);
    expect(client.reconnectTimeout).toBeUndefined();
  });
});
