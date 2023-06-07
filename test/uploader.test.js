// :copyright: Copyright (c) 2023 ftrack
import { Uploader } from "../source/uploader";
import { Session } from "../source/session";
import { expect } from "vitest";
import { server } from "./server";
import { rest } from "msw";

const credentials = {
  serverUrl: "http://ftrack.test",
  apiUser: "testuser",
  apiKey: "testkey",
};
let session = null;
let file = null;

beforeAll(() => {
  session = new Session(
    credentials.serverUrl,
    credentials.apiUser,
    credentials.apiKey,
    {
      autoConnectEventHub: false,
    }
  );

  const data = { foo: "bar" };
  file = new File([JSON.stringify(data)], "data.json", {
    type: "application/json",
  });
});

describe("Uploader", () => {
  it("Should support uploading files", () =>
    new Promise((done) => {
      const uploader = new Uploader(session, file, { onComplete: done });
      uploader.start();
    }));

  it("Should support uploading multi-part files", () =>
    new Promise((done) => {
      server.use(
        rest.post("http://ftrack.test/api", (req, res, ctx) => {
          return res.once(
            ctx.json([
              {
                action: "create",
                data: {
                  name: "20mb_empty_file",
                  file_type: ".data",
                  __entity_type__: "FileComponent",
                  system_type: "file",
                  id: "78e388a0-5752-48fe-a4e0-944d7cdfce2c",
                  size: 20971520,
                },
              },
              {
                component_id: "78e388a0-5752-48fe-a4e0-944d7cdfce2c",
                upload_id: "upload-id",
                urls: [
                  {
                    signed_url: "http://ftrack.test/file-url-1",
                    part_number: 1,
                  },
                  {
                    signed_url: "http://ftrack.test/file-url-2",
                    part_number: 2,
                  },
                  {
                    signed_url: "http://ftrack.test/file-url-3",
                    part_number: 3,
                  },
                ],
              },
            ])
          );
        })
      );
      const uploader = new Uploader(session, file, {
        fileSize: 20971520,
        onComplete: done,
      });
      uploader.start();
    }));

  it("Should throw an error if a name cannot be obtained", () => {
    expect(() => {
      new Uploader(session, file, {
        name: "",
      });
    }).toThrow();
  });
});
