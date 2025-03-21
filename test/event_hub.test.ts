import { EventHub } from "../source/event_hub.js";
import { Event } from "../source/event.js";
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
