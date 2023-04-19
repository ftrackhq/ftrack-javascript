import { EventHub } from "../source/event_hub";
import { test } from "vitest";

test("EventHub constructor", async () => {
  // Scenario 1
  const eventHub1 = new EventHub("https://ftrack.test", "testUser", "testKey", {
    applicationId: "custom.app.id",
  });

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
    "testKey"
  );

  // Check instance properties for scenario 2
  expect(eventHub2._applicationId).toBe("ftrack.api.javascript");
  expect(eventHub2._apiUser).toBe("testUser");
  expect(eventHub2._apiKey).toBe("testKey");
  expect(eventHub2._serverUrl).toBe("http://ftrack.test:8080");
  expect(eventHub2.logger).toBeDefined();
});

// TODO: Add EventHub tests that are relevant for a socket.io re-implementation
