import { EventHub } from "../source/event_hub.js";
import { Event } from "../source/event.js";
import SimpleSocketIOClient from "../source/simple_socketio.js";
import { vi, describe, expect, beforeEach, afterEach, test } from "vitest";

describe("EventHub", () => {
  let eventHub: any;
  let disconnectCalled = false;
  beforeEach(() => {
    eventHub = new EventHub("", "", "");
    disconnectCalled = false;
    eventHub._socketIo = {
      on: vi.fn(),
      emit: vi.fn(),
      socket: { connected: true },
      disconnect: vi.fn(() => (disconnectCalled = true)),
    };
    eventHub.isConnected = vi.fn(() => true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should correctly add subscribers", () => {
    const topicSubscriberCallback = vi.fn();
    const wildcardSubscriberCallback = vi.fn();

    const topicSubscriberId = eventHub.subscribe(
      "topic=ftrack.update",
      topicSubscriberCallback,
    );
    const wildcardSubscriberId = eventHub.subscribe(
      "topic=ftrack.*",
      wildcardSubscriberCallback,
    );

    expect(typeof topicSubscriberId).toBe("string");
    expect(eventHub.getSubscriberByIdentifier(topicSubscriberId).callback).toBe(
      topicSubscriberCallback,
    );
    expect(typeof wildcardSubscriberId).toBe("string");
    expect(
      eventHub.getSubscriberByIdentifier(wildcardSubscriberId).callback,
    ).toBe(wildcardSubscriberCallback);
  });

  test("should not subscribe without a valid topic", () => {
    const callback = vi.fn();
    expect(() => eventHub.subscribe("", callback)).toThrow();
    expect(() => eventHub.subscribe(null, callback)).toThrow();
    expect(() => eventHub.subscribe(undefined, callback)).toThrow();
    expect(() => eventHub.subscribe("*", callback)).toThrow();
    expect(() =>
      eventHub.subscribe("anything-except-topic", callback),
    ).toThrow();
  });

  test("should not subscribe without a valid callback", () => {
    expect(() => eventHub.subscribe("topic=ftrack.update", null)).toThrow();
    expect(() =>
      eventHub.subscribe("topic=ftrack.update", "not a function"),
    ).toThrow();
    expect(() => eventHub.subscribe("topic=ftrack.update", {})).toThrow();
  });

  test("should correctly unsubscribe", () => {
    const topicSubscriberCallback = vi.fn();
    const wildcardSubscriberCallback = vi.fn();
    const topicSubscriberId = eventHub.subscribe(
      "topic=ftrack.update",
      topicSubscriberCallback,
    );
    const wildcardSubscriberId = eventHub.subscribe(
      "topic=ftrack.*",
      wildcardSubscriberCallback,
    );

    const topicUnsubscribeSuccess = eventHub.unsubscribe(topicSubscriberId);
    const wildcardUnsubscribeSuccess =
      eventHub.unsubscribe(wildcardSubscriberId);

    expect(topicUnsubscribeSuccess).toBe(true);
    expect(wildcardUnsubscribeSuccess).toBe(true);
    expect(eventHub.getSubscriberByIdentifier(topicSubscriberId)).toBe(null);
    expect(eventHub.getSubscriberByIdentifier(wildcardSubscriberId)).toBe(null);
  });

  test("should not unsubscribe with an invalid ID", () => {
    const invalid1 = eventHub.unsubscribe("invalid ID");
    const invalid2 = eventHub.unsubscribe(null);
    const invalid3 = eventHub.unsubscribe(undefined);

    expect(invalid1).toBe(false);
    expect(invalid2).toBe(false);
    expect(invalid3).toBe(false);
  });

  test("should handle topic events", () => {
    const callback = vi.fn();
    const testEvent = { topic: "ftrack.test", data: {} };
    eventHub.subscribe("topic=ftrack.*", callback);

    eventHub._handle(testEvent);

    expect(callback).toHaveBeenCalledWith(testEvent);
  });

  test("should handle wildcard events", () => {
    const callback = vi.fn();
    const testEvent = { topic: "ftrack.test", data: {} };
    eventHub.subscribe("topic=ftrack.test", callback);

    eventHub._handle(testEvent);

    expect(callback).toHaveBeenCalledWith(testEvent);
  });

  test("should handle events with unexpected topics", () => {
    const callback = vi.fn();
    eventHub.subscribe("topic=ftrack.update", callback);
    const testEvent = { topic: null, data: {} };
    eventHub._handle(testEvent);
    expect(callback).not.toHaveBeenCalled();
  });

  test("should handle events with more unexpected topics", () => {
    const callback = vi.fn();
    eventHub.subscribe("topic=*", callback);
    const testEvent = { topic: null, data: {} };
    const testEvent2 = { topic: { topic: "topic" }, data: {} };
    const testEvent3 = { topic: ["topic"], data: {} };

    eventHub._handle(testEvent);
    eventHub._handle(testEvent2);
    eventHub._handle(testEvent3);

    expect(callback).not.toHaveBeenCalled();
  });

  test("should handle events without data", () => {
    const callback = vi.fn();
    eventHub.subscribe("topic=ftrack.update", callback);
    const testEvent = { topic: "ftrack.update" };
    eventHub._handle(testEvent);
    expect(callback).toHaveBeenCalledWith(testEvent);
  });

  test("Should not handle non subscribed events", () => {
    const callback = vi.fn();
    const testEvent = { topic: "test.topic", data: {} };
    eventHub.subscribe("topic=ftrack.*", callback);
    eventHub.subscribe("topic=ftrack.update", callback);
    eventHub.subscribe("topic=test.topic.*", callback);

    eventHub._handle(testEvent);

    expect(callback).not.toHaveBeenCalledWith(testEvent);
  });

  test("should handle sync callback and return correct data", async () => {
    const callback = vi.fn(() => "someData");
    const testEvent = {
      topic: "ftrack.test",
      data: {},
      id: "eventId",
      source: { id: "sourceId" },
    };

    const publishReplySpy = vi
      .spyOn(eventHub, "publishReply")
      .mockImplementation((_, data) => data);

    eventHub.subscribe("topic=ftrack.test", callback);
    const promises = eventHub._handle(testEvent);
    await Promise.all(promises);
    expect(callback).toHaveBeenCalledWith(testEvent);
    expect(publishReplySpy).toHaveBeenCalledWith(
      expect.anything(),
      "someData",
      expect.anything(),
    );
    publishReplySpy.mockRestore();
  });

  test("should not handle async callback with a promise", async () => {
    const asyncCallback = vi.fn(async () => "someData");
    const testEvent = {
      topic: "ftrack.test",
      data: {},
      id: "eventId",
      source: { id: "sourceId" },
    };

    const publishReplySpy = vi
      .spyOn(eventHub, "publishReply")
      .mockImplementation((_, data) => data);

    eventHub.subscribe("topic=ftrack.test", asyncCallback);
    const promises = eventHub._handle(testEvent);
    await Promise.all(promises ?? []);
    expect(asyncCallback).toHaveBeenCalledWith(testEvent);
    expect(publishReplySpy).toHaveBeenCalled();
    expect(publishReplySpy).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Promise),
      expect.anything(),
    );
    expect(publishReplySpy).toHaveBeenCalledWith(
      expect.anything(),
      "someData",
      expect.anything(),
    );
    publishReplySpy.mockRestore();
  });
  test("publishReply published Event with correct shape", async () => {
    eventHub.publish = vi.fn();

    const sourceEventPayload = {
      source: { id: "testId" },
      id: "anotherTestId",
    };

    const data = {
      someData: "value",
    };

    await eventHub.publishReply(sourceEventPayload, data);

    const publishedEvent = eventHub.publish.mock.calls[0][0];
    expect(publishedEvent).toBeInstanceOf(Event);
    const EventData = publishedEvent.getData();
    // Ignoring the id field for comparison
    delete EventData.id;

    const expectedEvent = {
      topic: "ftrack.meta.reply",
      data: { someData: "value" },
      source: null,
      target: "id=testId",
      inReplyToEvent: "anotherTestId",
    };
    expect(EventData).toEqual(expectedEvent);
  });

  test("Disconnecting should disconnect the socket", () => {
    eventHub.disconnect();
    expect(disconnectCalled).toBe(true);
  });
});

describe("EventHub sharing a SimpleSocketIOClient singleton", () => {
  // Regression test for the publishAndWaitForReply drop-on-second-Session
  // bug: SimpleSocketIOClient.connect() is a singleton keyed on
  // (serverUrl, apiUser, apiKey). A second EventHub built with the same
  // credentials reuses the already-open socket. Each EventHub generates
  // its own _id and registers its reply subscription inside
  // _onSocketConnected, wired via socketIo.on("connect", ...). Because
  // the "connect" event has already fired by the time the second hub
  // attaches its listener, the listener would never run without the
  // already-connected check in EventHub#connect — so the second hub
  // would never tell the server about a subscription with its own _id,
  // and replies targeted at it would be silently dropped on the server.
  function makeSharedSocket() {
    const handlers: Record<string, Array<(data: unknown) => void>> = {};
    return {
      socket: { connected: false },
      emit: vi.fn(),
      reconnect: vi.fn(),
      disconnect: vi.fn(),
      on(name: string, cb: (data: unknown) => void) {
        (handlers[name] ||= []).push(cb);
      },
      fire(name: string, data: unknown) {
        handlers[name]?.forEach((cb) => cb(data));
      },
    };
  }

  function emittedReplySubscriberIds(
    socket: ReturnType<typeof makeSharedSocket>,
  ) {
    return socket.emit.mock.calls
      .filter(
        ([eventName, payload]) =>
          eventName === "ftrack.event" &&
          (payload as any)?.topic === "ftrack.meta.subscribe" &&
          (payload as any)?.data?.subscription === "topic=ftrack.meta.reply",
      )
      .map(([, payload]) => (payload as any)?.data?.subscriber?.id);
  }

  test("second hub registers its reply subscription even when the shared socket is already connected", async () => {
    const sharedSocket = makeSharedSocket();
    // Stand in for SimpleSocketIOClient.connect's credential-keyed
    // singleton: both EventHubs get the same socket object back.
    const connectSpy = vi
      .spyOn(SimpleSocketIOClient, "connect")
      .mockReturnValue(sharedSocket as unknown as SimpleSocketIOClient);

    try {
      const hubA = new EventHub("http://ftrack.test", "user", "key") as any;
      const hubB = new EventHub("http://ftrack.test", "user", "key") as any;

      // Hub A connects before the socket opens (normal first-Session
      // case). Its on("connect", ...) listener registers, then the
      // socket finishes opening and fires "connect".
      hubA.connect();
      sharedSocket.socket.connected = true;
      sharedSocket.fire("connect", {});
      // publish() chains emits through a microtask; flush it.
      await Promise.resolve();
      await Promise.resolve();

      const hubAReplySub = hubA._subscribers.find(
        (s: any) => s.subscription === "topic=ftrack.meta.reply",
      );
      expect(hubAReplySub?.metadata.id).toBe(hubA._id);
      expect(emittedReplySubscriberIds(sharedSocket)).toContain(hubA._id);

      // Hub B connects AFTER the only "connect" event has fired. Without
      // the already-connected fast-path in EventHub#connect, Hub B's
      // _onSocketConnected would never run.
      hubB.connect();
      await Promise.resolve();
      await Promise.resolve();

      // With the fix in place, Hub B has its reply subscription
      // registered locally and the server has been notified with Hub B's
      // own _id — so future replies with target="id=<hubB._id>" will
      // match a subscription on the server and reach this hub.
      const hubBReplySub = hubB._subscribers.find(
        (s: any) => s.subscription === "topic=ftrack.meta.reply",
      );
      expect(hubBReplySub?.metadata.id).toBe(hubB._id);
      expect(emittedReplySubscriberIds(sharedSocket)).toContain(hubB._id);
    } finally {
      connectSpy.mockRestore();
    }
  });

  test("publishAndWaitForReply routes replies to the correct hub on a shared socket", async () => {
    const sharedSocket = makeSharedSocket();
    const connectSpy = vi
      .spyOn(SimpleSocketIOClient, "connect")
      .mockReturnValue(sharedSocket as unknown as SimpleSocketIOClient);

    try {
      const hubA = new EventHub("http://ftrack.test", "user", "key") as any;
      const hubB = new EventHub("http://ftrack.test", "user", "key") as any;

      hubA.connect();
      sharedSocket.socket.connected = true;
      sharedSocket.fire("connect", {});
      hubB.connect();
      await Promise.resolve();
      await Promise.resolve();

      sharedSocket.emit.mockClear();

      // Each hub kicks off a publishAndWaitForReply. They share one
      // underlying socket — replies need to land on the correct hub.
      const replyAPromise = hubA.publishAndWaitForReply(
        new Event("foo.bar", { who: "A" }),
      );
      const replyBPromise = hubB.publishAndWaitForReply(
        new Event("foo.bar", { who: "B" }),
      );
      await Promise.resolve();
      await Promise.resolve();

      // Pull the emitted ftrack.event payloads to learn each hub's
      // event id and confirm source.id reflects the publishing hub.
      const emittedFooBar = sharedSocket.emit.mock.calls
        .filter(
          ([eventName, payload]) =>
            eventName === "ftrack.event" &&
            (payload as any)?.topic === "foo.bar",
        )
        .map(([, payload]) => payload as any);
      const eventA = emittedFooBar.find((p) => p.data.who === "A");
      const eventB = emittedFooBar.find((p) => p.data.who === "B");
      expect(eventA?.source?.id).toBe(hubA._id);
      expect(eventB?.source?.id).toBe(hubB._id);

      // Simulate the event server delivering a reply addressed to hub A.
      // Both hubs receive every "ftrack.event" through the shared
      // socket's handler chain — only the hub whose _replyCallbacks
      // contains the matching inReplyToEvent should resolve.
      sharedSocket.fire("ftrack.event", {
        topic: "ftrack.meta.reply",
        data: { result: "A-reply" },
        source: { id: "responder" },
        id: "server-reply-1",
        inReplyToEvent: eventA.id,
        target: `id=${hubA._id}`,
      });
      // …and a reply for hub B.
      sharedSocket.fire("ftrack.event", {
        topic: "ftrack.meta.reply",
        data: { result: "B-reply" },
        source: { id: "responder" },
        id: "server-reply-2",
        inReplyToEvent: eventB.id,
        target: `id=${hubB._id}`,
      });

      const [replyA, replyB] = await Promise.all([
        replyAPromise,
        replyBPromise,
      ]);
      expect((replyA as any).data.result).toBe("A-reply");
      expect((replyB as any).data.result).toBe("B-reply");
    } finally {
      connectSpy.mockRestore();
    }
  });

  test("reconnect re-runs _onSocketConnected for both hubs without duplicating local subscribers", async () => {
    const sharedSocket = makeSharedSocket();
    const connectSpy = vi
      .spyOn(SimpleSocketIOClient, "connect")
      .mockReturnValue(sharedSocket as unknown as SimpleSocketIOClient);

    try {
      const hubA = new EventHub("http://ftrack.test", "user", "key") as any;
      const hubB = new EventHub("http://ftrack.test", "user", "key") as any;

      hubA.connect();
      sharedSocket.socket.connected = true;
      sharedSocket.fire("connect", {});
      hubB.connect();
      await Promise.resolve();
      await Promise.resolve();

      const replySubs = (hub: any) =>
        hub._subscribers.filter(
          (s: any) => s.subscription === "topic=ftrack.meta.reply",
        );
      expect(replySubs(hubA)).toHaveLength(1);
      expect(replySubs(hubB)).toHaveLength(1);

      // Simulate a reconnect: real handleOpen() fires "connect" again
      // after the socket recovers. Both hubs are now wired up for it.
      sharedSocket.emit.mockClear();
      sharedSocket.fire("connect", {});
      await Promise.resolve();
      await Promise.resolve();

      // _onSocketConnected catches NotUniqueError from the duplicate
      // subscribe() call, so the local subscriber list stays at one
      // entry per hub.
      expect(replySubs(hubA)).toHaveLength(1);
      expect(replySubs(hubB)).toHaveLength(1);

      // …but both hubs do re-notify the server (via the for-loop in
      // _onSocketConnected), which is the intended behaviour for
      // surviving an event-server-side state loss.
      const reNotifiedIds = emittedReplySubscriberIds(sharedSocket);
      expect(reNotifiedIds).toContain(hubA._id);
      expect(reNotifiedIds).toContain(hubB._id);
    } finally {
      connectSpy.mockRestore();
    }
  });
});

test("EventHub constructor", async () => {
  // Scenario 1
  const eventHub1 = new EventHub("https://ftrack.test", "testUser", "testKey", {
    applicationId: "custom.app.id",
  }) as any;

  // Check instance properties for scenario 1
  expect(eventHub1._applicationId).toBe("custom.app.id");
  expect(eventHub1._apiUser).toBe("testUser");
  expect(eventHub1._apiKey).toBe("testKey");
  expect(eventHub1._serverUrl).toBe("https://ftrack.test:443");
  expect(eventHub1.logger).toBeDefined();

  // Scenario 2
  const eventHub2 = new EventHub(
    "http://ftrack.test:8080",
    "testUser",
    "testKey",
  ) as any;

  // Check instance properties for scenario 2
  expect(eventHub2._applicationId).toBe("ftrack.api.javascript");
  expect(eventHub2._apiUser).toBe("testUser");
  expect(eventHub2._apiKey).toBe("testKey");
  expect(eventHub2._serverUrl).toBe("http://ftrack.test:8080");
  expect(eventHub2.logger).toBeDefined();
});
