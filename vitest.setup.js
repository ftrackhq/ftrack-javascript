import { fetch } from "cross-fetch";
import { server } from "./test/server";

// Very simple mock of XmlHttpRequest with only the parts we use
class MockXmlHttpRequest {
  open() {}
  send() {
    this.upload.dispatchEvent(new Event("progress"));
    this.onload();
  }
  abort() {
    this.onabort();
  }
  setRequestHeader() {}
  upload = new EventTarget();
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  global.fetch = fetch;
  global.XMLHttpRequest = MockXmlHttpRequest;
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  server.resetHandlers();
});
