// :copyright: Copyright (c) 2022 ftrack
import {
  HttpResponse,
  type PathParams,
  http,
  HttpHandler,
  ws,
  WebSocketHandler,
} from "msw";
import fs from "fs/promises";
import querySchemas from "./fixtures/query_schemas.json" with { type: "json" };
import queryServerInformation from "./fixtures/query_server_information.json" with { type: "json" };
import getUploadMetadata from "./fixtures/get_upload_metadata.json" with { type: "json" };
import completeMultipartUpload from "./fixtures/complete_multipart_upload.json" with { type: "json" };
import exampleQuery from "./fixtures/query_select_name_from_task_limit_1.json" with { type: "json" };
import { setupServer } from "msw/node";
const InvalidCredentialsError = {
  content:
    'The supplied API key is not valid. API keys are created from Settings under the page API keys. The api key should be passed in the request header "ftrack-api-key".',
  exception: "InvalidCredentialsError",
  error_code: null,
};

function authenticate(info: Parameters<Parameters<typeof http.post>[1]>[0]) {
  // allow returning invalid authentication by setting ftrack-api-key to "INVALID_API_KEY"
  // otherwise, return true
  if (info.request.headers.get("ftrack-api-key") === "INVALID_API_KEY") {
    return false;
  }
  return true;
}

function pick<T>(object: T, keys: (keyof T)[]) {
  return keys.reduce((obj, key) => {
    if (object && Object.hasOwn(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {} as T);
}

export function getInitialSessionQuery() {
  return [queryServerInformation, querySchemas];
}

export function getExampleQuery() {
  return [exampleQuery];
}

// Get socket io session id
const handleSocketIORequest: Parameters<typeof http.get>[1] = (info) => {
  if (!authenticate(info)) {
    return HttpResponse.json(InvalidCredentialsError);
  }
  return HttpResponse.text("1234567890:"); // The returned session ID has a colon and then some other information at the end. This only has the colon, to check that the colon is removed.
};
const eventServer = ws.link("ws://ftrack.test/*");
const secureEventServer = ws.link("wss://ftrack.test/*");

export const handlers: (HttpHandler | WebSocketHandler)[] = [
  http.post<PathParams, any[]>("http://ftrack.test/api", async (info) => {
    if (!authenticate(info)) {
      return HttpResponse.json(InvalidCredentialsError);
    }
    const body = await Promise.all(
      (await info.request.json()).map(
        async ({
          action,
          expression,
          entity_type: entityType,
          entity_data: entityData,
        }) => {
          switch (action) {
            case "query_server_information":
              return queryServerInformation;
            case "query_schemas":
              return querySchemas;
            case "create": {
              // create are fetched from test/fixtures where the file name matches the full expression
              const createFixture = await fs.readFile(
                `${__dirname}/fixtures/create_${entityType.toLowerCase()}.json`,
                {
                  encoding: "utf-8",
                },
              );
              const response = JSON.parse(createFixture);
              return {
                ...response,
                data: {
                  ...response.data,
                  ...pick(entityData, ["id"]),
                },
              };
            }
            case "delete":
              return {
                action: "delete",
                data: true,
              };
            case "update":
              // update are fetched from test/fixtures where the file name matches the full expression
              return JSON.parse(
                await fs.readFile(
                  `${__dirname}/fixtures/update_${entityType.toLowerCase()}.json`,
                  {
                    encoding: "utf-8",
                  },
                ),
              );
            case "query":
              // queries are fetched from test/fixtures where the file name matches the full expression
              return JSON.parse(
                await fs.readFile(
                  `${__dirname}/fixtures/query_${expression
                    .toLowerCase()
                    .split(" ")
                    .join("_")}.json`,
                  { encoding: "utf-8" },
                ),
              );
            case "get_upload_metadata":
              return getUploadMetadata;
            case "complete_multipart_upload":
              return completeMultipartUpload;
            default:
              throw new Error("Action not supported by test server.");
          }
        },
      ),
    );
    return HttpResponse.json(body);
  }),
  http.options("http://ftrack.test/file-url", async () => {
    return new Response("file", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
  http.put("http://ftrack.test/file-url", async () => {
    return new Response(null, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }),
  // Get socket io session id
  http.get("https://ftrack.test/socket.io/1/", handleSocketIORequest),
  http.get("http://ftrack.test/socket.io/1/", handleSocketIORequest),
  http.get("https://ftrack.test/*", () => {
    return new Response(null, { status: 200 });
  }),

  http.get("http://ftrack.test:8080/*", () => {
    return new Response(null, { status: 200 });
  }),
  eventServer.addEventListener("connection", ({ client }) => {
    // Just catch the connection event and close it immediately
    client.close();
  }),
  secureEventServer.addEventListener("connection", ({ client }) => {
    // Just catch the connection event and close it immediately
    client.close();
  }),
];

export const server = setupServer(...handlers);
