import { fetch } from "cross-fetch";
import { server } from "./test/server";

// Very simple mock of XmlHttpRequest with only the parts we use
class MockXmlHttpRequest extends EventTarget {
  open() {}
  send(file) {
    this.upload.dispatchEvent(new Event("progress"));
    this.onreadystatechange?.();
    this.onload?.(file);
  }
  abort() {
    this.onabort();
  }
  setRequestHeader() {}
  getResponseHeader(header) {
    return header;
  }
  upload = new EventTarget();
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
