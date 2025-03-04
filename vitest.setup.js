import { fetch } from "cross-fetch";
import { server } from "./test/server.js";

// Very simple mock of XmlHttpRequest with only the parts we use
class MockXmlHttpRequest extends EventTarget {
  open() {}
  send(file) {
    this.upload.dispatchEvent(new Event("progress"));
    if (!this.aborted) {
      this.onreadystatechange?.();
      this.onload?.(file);
    }
  }
  abort() {
    this.aborted = true;
    this.dispatchEvent(new Event("abort"));
    this.onabort();
  }
  setRequestHeader() {}
  getResponseHeader(header) {
    return header;
  }
  upload = new EventTarget();
  aborted = false;
  timeout = 0;
  readyState = 4;
  status = 200;
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
