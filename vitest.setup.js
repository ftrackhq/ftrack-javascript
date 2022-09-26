import { fetch } from "cross-fetch";
import { setupServer } from "msw/node";
import { handlers } from "./test/server";

const server = setupServer(...handlers);

global.fetch = fetch;
// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

//  Close server after all tests
afterAll(() => {
  server.close();
});

// Reset handlers after each test `important for test isolation`
afterEach(() => {
  server.resetHandlers();
});
