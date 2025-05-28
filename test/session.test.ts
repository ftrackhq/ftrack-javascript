// :copyright: Copyright (c) 2022 ftrack
import { beforeAll, describe, it, expect } from "vitest";

import { v4 as uuidV4 } from "uuid";
import loglevel from "loglevel";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import {
  ServerPermissionDeniedError,
  ServerValidationError,
  ServerError,
} from "../source/error.js";
import { Session, expression } from "../source/session.js";
import * as operation from "../source/operation.js";
import querySchemas from "./fixtures/query_schemas.json" with { type: "json" };
import queryServerInformation from "./fixtures/query_server_information.json" with { type: "json" };

import { getExampleQuery, getInitialSessionQuery, server } from "./server.js";
import { HttpResponse, type PathParams, http } from "msw";
import type { QueryResponse, Data } from "../source/types.js";

dayjs.extend(utc);

const logger = loglevel.getLogger("test_session");
logger.setLevel("debug");

const credentials = {
  serverUrl: "http://ftrack.test",
  apiUser: "testuser",
  apiKey: "testkey",
};
let session: Session = null!;

function getTestUsername() {
  return `testName-${uuidV4()}`; // Use the same test user name format as the E2E tests. Simplifies cleanup if running the tests against a real server.
}

beforeAll(async () => {
  session = new Session(
    credentials.serverUrl,
    credentials.apiUser,
    credentials.apiKey,
    {
      autoConnectEventHub: false,
      decodeDatesAsIso: false,
    },
  );
  await session.initializing;
});

describe("Session", () => {
  logger.debug("Running session tests.");

  it("Should initialize the session automatically", async () => {
    await expect(session.initializing).resolves.toBeTruthy();
  });

  it("Should reject invalid credentials", async () => {
    const badSession = new Session(
      credentials.serverUrl,
      credentials.apiUser,
      "INVALID_API_KEY",
      {
        autoConnectEventHub: false,
      },
    );
    await expect(badSession.initializing).rejects.toThrow(ServerError);
  });

  it("Should allow querying a Task", () =>
    expect(
      session
        .query("select name from Task limit 1")
        .then((response) => response.data[0].__entity_type__),
    ).resolves.toEqual("Task"));

  it("Should allow adding additional headers on Session", async () => {
    const headers = new Promise<Headers>((resolve) => {
      server.use(
        http.post(
          "http://ftrack.test/api",
          (info) => {
            resolve(info.request.headers as any);
            return HttpResponse.json(getInitialSessionQuery());
          },
          { once: true },
        ),
      );
    });

    new Session(
      credentials.serverUrl,
      credentials.apiUser,
      credentials.apiKey,
      {
        autoConnectEventHub: false,
        additionalHeaders: {
          "X-Test-Header": "test",
        },
      },
    );
    await session.initializing;

    return expect((await headers).get("X-Test-Header")).toEqual("test");
  });

  it("Should support strictApi option", async () => {
    const headers = new Promise<Headers>((resolve) => {
      server.use(
        http.post(
          "http://ftrack.test/api",
          (info) => {
            resolve(info.request.headers);
            return HttpResponse.json(getInitialSessionQuery());
          },
          { once: true },
        ),
      );
    });

    new Session(
      credentials.serverUrl,
      credentials.apiUser,
      credentials.apiKey,
      {
        autoConnectEventHub: false,
        strictApi: true,
      },
    );

    return expect((await headers).get("ftrack-strict-api")).toEqual("true");
  });

  it("Should allow querying with datetimes decoded as dayjs objects (default)", async () => {
    const result = await session.query(
      "select name, created_at from Task limit 1",
    );
    expect(result.data[0].created_at).toBeInstanceOf(dayjs);
    expect(result.data[0].created_at.toISOString()).toEqual(
      "2022-10-10T10:12:09.000Z",
    );
  });

  it("Should allow querying with datetimes decoded as ISO objects", async () => {
    const result = await session.query(
      "select name, created_at from Task limit 1",
      { decodeDatesAsIso: true },
    );
    expect(result.data[0].created_at).toEqual("2022-10-10T10:12:09.000Z");
  });
  it("Should allow querying with datetimes decoded as ISO objects, when set on session initialization", async () => {
    const decodeDatesAsIsoSession = new Session(
      credentials.serverUrl,
      credentials.apiUser,
      credentials.apiKey,
      {
        decodeDatesAsIso: true,
      },
    );
    await decodeDatesAsIsoSession.initializing;
    const result = await decodeDatesAsIsoSession.query(
      "select name, created_at from Task limit 1",
    );
    expect(result.data[0].created_at).toEqual("2022-10-10T10:12:09.000Z");
  });
  it("Should allow overriding session decodeDatesAsIso when querying", async () => {
    const decodeDatesAsIsoSession = new Session(
      credentials.serverUrl,
      credentials.apiUser,
      credentials.apiKey,
      {
        decodeDatesAsIso: true,
      },
    );
    await decodeDatesAsIsoSession.initializing;
    const result = await decodeDatesAsIsoSession.query(
      "select name, created_at from Task limit 1",
      { decodeDatesAsIso: false },
    );
    expect(result.data[0].created_at).toBeInstanceOf(dayjs);
    expect(result.data[0].created_at.toISOString()).toEqual(
      "2022-10-10T10:12:09.000Z",
    );
    const result2 = await session.query(
      "select name, created_at from Task limit 1",
      { decodeDatesAsIso: true },
    );
    expect(result2.data[0].created_at).toEqual("2022-10-10T10:12:09.000Z");
  });

  it("Should allow querying with datetimes decoded as ISO objects with timezone support disabled", async () => {
    server.use(
      http.post(
        "http://ftrack.test/api",
        () => {
          return HttpResponse.json([
            { ...queryServerInformation, is_timezone_support_enabled: false },
            querySchemas,
          ]);
        },
        { once: true },
      ),
    );
    const timezoneDisabledSession = new Session(
      credentials.serverUrl,
      credentials.apiUser,
      credentials.apiKey,
      {
        autoConnectEventHub: false,
      },
    );
    await timezoneDisabledSession.initializing;
    const result = await timezoneDisabledSession.query(
      "select name, created_at from Task limit 1",
      { decodeDatesAsIso: true },
    );
    expect(result.data[0].created_at).toEqual("2022-10-10T08:12:09.000Z");
  });

  it("Should allow adding additional headers on calls", async () => {
    const headers = new Promise<Headers>((resolve) => {
      server.use(
        http.post(
          "http://ftrack.test/api",
          (info) => {
            resolve(info.request.headers as any);
            return HttpResponse.json(getExampleQuery());
          },
          { once: true },
        ),
      );
    });

    await session.query("select name from Task limit 1", {
      additionalHeaders: { "X-Test-Header": "test" },
    });
    return expect((await headers).get("X-Test-Header")).toEqual("test");
  });

  it("Should allow api option header based on ensureSerializableResponse", async () => {
    const headers = new Promise<Headers>((resolve) => {
      server.use(
        http.post(
          "http://ftrack.test/api",
          (info) => {
            resolve(info.request.headers as any);
            return HttpResponse.json(getInitialSessionQuery());
          },
          { once: true },
        ),
      );
    });

    const newSession = new Session(
      credentials.serverUrl,
      credentials.apiUser,
      credentials.apiKey,
      {
        ensureSerializableResponse: false,
      },
    );
    await newSession.initializing;
    return expect((await headers).get("ftrack-api-options")).toBeFalsy();
  });

  it("Should allow creating a User", () => {
    const promise = session.create("User", {
      username: getTestUsername(),
    });

    return expect(
      promise.then((response) => response.data.__entity_type__),
    ).resolves.toEqual("User");
  });

  it("Should allow deleting a User", async () => {
    const username = getTestUsername();
    const promise = session
      .create("User", {
        username,
      })
      .then((newUserResponse) => {
        const userId = newUserResponse.data.id;
        const deletePromise = session.delete("User", userId);
        return deletePromise;
      });

    await expect(
      promise.then((response) => response.data),
    ).resolves.toBeTruthy();
  });

  it("Should allow updating a User", async () => {
    const username = getTestUsername();
    const shortUsername = username.slice(0, -30);
    const promise = session
      .create("User", {
        shortUsername,
      })
      .then((newUserResponse) => {
        const userId = newUserResponse.data.id;
        const updatePromise = session.update("User", userId, {
          username: username,
        });

        return updatePromise;
      });
    // Checks a regex matching the username generated by getTestUsername()
    await expect(
      promise.then((response) => response.data.username),
    ).resolves.toMatch(/^testName-[0-9a-f-]{36}$/);
  });

  it("Should support api query 2-level nested data", async () => {
    const response = await session.query(
      "select status.state.short from Task where status.state.short is NOT_STARTED limit 2",
    );
    const { data } = response;
    expect(data[0].status.state.short).toEqual("NOT_STARTED");
    expect(data[1].status.state.short).toEqual("NOT_STARTED");

    expect(data[0].status.state).toEqual(data[1].status.state);
  });

  it("Should decode batched query operations", async () => {
    const responses = await session.call<
      QueryResponse<{ status: { state: { short: string } } }>
    >([
      operation.query(
        "select status.state.short from Task where status.state.short is NOT_STARTED limit 1",
      ),
      operation.query(
        "select status.state.short from Task where status.state.short is NOT_STARTED limit 1",
      ),
    ]);
    const status1 = responses[0].data[0].status;
    const status2 = responses[1].data[0].status;
    expect(status1.state.short).toEqual("NOT_STARTED");
    expect(status2.state.short).toEqual("NOT_STARTED");
    expect(status1).toEqual(status2);
  });

  it("Should decode self-referencing entities", async () => {
    const response = await session.query(
      "select version, asset.versions.version from AssetVersion where asset_id is_not None limit 1",
    );

    const versionNumber = response.data[0].version;
    const versionId = response.data[0].id;
    const assetVersions = response.data[0].asset.versions;
    const versionNumber2 = assetVersions.find(
      (item: any) => item.id === versionId,
    ).version;
    expect(versionNumber).toEqual(versionNumber2);
  });

  it("Should support uploading files", async () => {
    const data = { foo: "bar" };
    const file = new File([JSON.stringify(data)], "data.json", {
      type: "application/json",
    });

    const response = await session.createComponent(file);
    expect(response[0].data.__entity_type__).toEqual("FileComponent");
    expect(response[0].data.file_type).toEqual(".json");
    expect(response[0].data.name).toEqual("data");
  });

  it("Should return ComponentLocation and metadata when uploading files", async () => {
    const data = { foo: "bar" };
    const file = new File([JSON.stringify(data)], "data.json", {
      type: "application/json",
    });

    const response = (await session.createComponent(file)) as any;
    expect(response[0].data.__entity_type__).toEqual("FileComponent");
    expect(response[1].data.__entity_type__).toEqual("ComponentLocation");
    expect(response[2].url).toBeDefined();
    expect(response[2].headers).toBeDefined();
  });

  it("Should support uploading blob", async () => {
    const data = { foo: "bar" };
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });

    const response = await session.createComponent(blob, {
      name: "data.json",
    });
    expect(response[0].data.__entity_type__).toEqual("FileComponent");
  });

  it("Should support abort of uploading file using xhr", async () => {
    const data = { foo: "bar" };
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });

    const xhr = new XMLHttpRequest();
    const promise = new Promise((resolve) => {
      const onAborted = () => {
        resolve(true);
      };

      session.createComponent(blob, {
        xhr,
        name: "data.json",
        onProgress: () => {
          xhr.abort();
        },
        onAborted,
      });
    });
    await expect(promise).resolves.toEqual(true);
  });

  it("Should support abort of uploading file using signal", async () => {
    const data = { foo: "bar" };
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });

    const controller = new AbortController();
    const promise = new Promise((resolve) => {
      const onAborted = () => {
        resolve(true);
      };

      session.createComponent(blob, {
        signal: controller.signal,
        name: "data.json",
        onProgress: () => {
          controller.abort();
        },
        onAborted,
      });
    });
    await expect(promise).resolves.toEqual(true);
  });

  it.skip("Should support ensure with create", async () => {
    const identifyingKeys = [
      "key" as const,
      "parent_id" as const,
      "parent_type" as const,
    ];
    const key = uuidV4();

    await session.initializing;
    const { data } = await session.query(
      `select id from User where username is "${session.apiUser}"`,
    );
    const user = data[0];
    const ensuredData = await session.ensure(
      "Metadata",
      {
        key,
        value: "foo",
        parent_id: user.id,
        parent_type: "User",
      },
      identifyingKeys,
    );
    expect(ensuredData.__entity_type__).toEqual("Metadata");
    expect(ensuredData.key).toEqual(key);
    expect(ensuredData.value).toEqual("foo");
    expect(ensuredData.parent_id).toEqual(user.id);
    expect(ensuredData.parent_type).toEqual("User");
  });

  it.skip("Should support ensure with update", async (done: any) => {
    const identifyingKeys = ["key", "parent_id", "parent_type"];
    const key = uuidV4();

    let user: Data;
    const promise = session.initializing
      .then(() =>
        session.query(
          `select id from User where username is "${session.apiUser}"`,
        ),
      )
      .then(({ data }) => {
        user = data[0];
        return session.create("Metadata", {
          key,
          value: "foo",
          parent_id: user.id,
          parent_type: "User",
        });
      })
      .then(() =>
        session.ensure(
          "Metadata",
          {
            key,
            value: "bar",
            parent_id: user.id,
            parent_type: "User",
          },
          identifyingKeys as any,
        ),
      );
    promise
      .then((data) => {
        try {
          expect(data.__entity_type__).toEqual("Metadata");
          expect(data.key).toEqual(key);
          expect(data.value).toEqual("bar");
          expect(data.parent_id).toEqual(user.id);
          expect(data.parent_type).toEqual("User");
        } catch (error) {
          done(error);
        }
      })
      .then(done);
  });

  it.skip("Should support ensure with update dayjs object as criteria", async (done: any) => {
    const now = dayjs();

    const name = uuidV4();

    const promise = session.initializing
      .then(() =>
        session.create("Project", {
          start_date: now,
          end_date: now,
          name,
          full_name: "foo",
        }),
      )
      .then(() =>
        session.ensure(
          "Project",
          {
            start_date: now,
            end_date: now,
            name,
            full_name: "bar",
          },
          ["start_date"],
        ),
      );
    promise
      .then((data) => {
        try {
          expect(data.__entity_type__).toEqual("Project");
          expect(data.full_name).toEqual("bar");
        } catch (error) {
          done(error);
        }
      })
      .then(done);
  });

  it("Should support uploading files with custom component id", async () => {
    const componentId = uuidV4();
    const data = { foo: "bar" };
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });

    const response = await session.createComponent(blob, {
      name: "data.json",
      data: { id: componentId },
    });

    expect(response[0].data.id).toEqual(componentId);
  });

  it("Should support generating thumbnail URL with + in username", () => {
    const componentId = uuidV4();
    const previousUser = session.apiUser;
    session.apiUser = "user+test@example.com";
    const url = session.thumbnailUrl(componentId);
    expect(url).toEqual(
      `${credentials.serverUrl}/component/thumbnail?` +
        `id=${componentId}&size=300` +
        `&username=${encodeURIComponent(session.apiUser)}` +
        `&apiKey=${credentials.apiKey}`,
    );
    session.apiUser = previousUser;
  });

  it("Should return correct error", () => {
    expect(
      //@ts-ignore - Otherwise internal method used for testing purposes
      session.getErrorFromResponse({
        exception: "PermissionError",
        content: "foo",
      }),
    ).toBeInstanceOf(ServerPermissionDeniedError);
    expect(
      //@ts-ignore - Otherwise internal method used for testing purposes
      session.getErrorFromResponse({
        exception: "FTAuthenticationError",
        content: "foo",
      }),
    ).toBeInstanceOf(ServerPermissionDeniedError);
    expect(
      //@ts-ignore - Otherwise internal method used for testing purposes
      session.getErrorFromResponse({
        exception: "ValidationError",
        content: "foo",
      }),
    ).toBeInstanceOf(ServerValidationError);
    expect(
      //@ts-ignore - Otherwise internal method used for testing purposes
      session.getErrorFromResponse({
        exception: "Foo",
        content: "foo",
      }),
    ).toBeInstanceOf(ServerError);
    expect(
      //@ts-ignore - Otherwise internal method used for testing purposes
      session.getErrorFromResponse({
        exception: "MalformedResponseError",
        content: "foo",
      }),
    ).toBeInstanceOf(ServerError);
  });
  it("If configure_totp returns validation error, we expect it to throw ValidationError", async () => {
    const secret = "";
    const code = "";
    server.use(
      http.post<PathParams, any[]>(
        "http://ftrack.test/api",
        async (info) => {
          const payload = await info.request.json();
          if (payload[0].action === "configure_totp") {
            return HttpResponse.json({
              content: "Code must be provided to enable totp.",
              exception: "ValidationError",
              error_code: null,
            });
          }
        },
        { once: true },
      ),
    );

    await expect(() =>
      session.call([{ action: "configure_totp", secret, code }], {
        decodeDatesAsIso: true,
      }),
    ).rejects.toThrowError("Code must be provided to enable totp.");
  });

  it("Should support getting schemas with session.getSchemas()", async () => {
    expect(await session.getSchemas()).toEqual(querySchemas);
  });

  it("Should support getting server information with session.getServerInformation()", async () => {
    expect(await session.getServerInformation()).toEqual(
      queryServerInformation,
    );
  });

  it("Should support getting server version with session.getServerVersion()", async () => {
    expect(await session.getServerVersion()).toEqual("dev");
  });
});

describe("Encoding entities", () => {
  it("Should support encoding dayjs dates", () => {
    const now = dayjs();

    //@ts-ignore - Otherwise internal method used for testing purposes
    const output = session.encode([{ foo: now, bar: "baz" }, 12321]);

    expect(output).toEqual([
      {
        foo: {
          __type__: "datetime",
          value: now.toISOString(),
        },
        bar: "baz",
      },
      12321,
    ]);
  });
  it("Should support encoding dayjs dates to local timezone if timezone support is disabled", async () => {
    const now = dayjs();
    server.use(
      http.post(
        "http://ftrack.test/api",
        () => {
          return HttpResponse.json([
            { ...queryServerInformation, is_timezone_support_enabled: false },
            querySchemas,
          ]);
        },
        { once: true },
      ),
    );
    const timezoneDisabledSession = new Session(
      credentials.serverUrl,
      credentials.apiUser,
      credentials.apiKey,
      {
        autoConnectEventHub: false,
      },
    );
    await timezoneDisabledSession.initializing;

    //@ts-ignore - Otherwise internal method used for testing purposes
    const output = timezoneDisabledSession.encode([
      { foo: now, bar: "baz" },
      12321,
    ]);

    expect(output).toEqual([
      {
        foo: {
          __type__: "datetime",
          value: now.local().format("YYYY-MM-DDTHH:mm:ss"),
        },
        bar: "baz",
      },
      12321,
    ]);
  });

  describe("Decoding entities", () => {
    it("Should support merging 0-level nested data", async () => {
      await session.initializing;

      //@ts-ignore - Otherwise internal method used for testing purposes
      const data = session.decode([
        {
          id: 1,
          __entity_type__: "Task",
          name: "foo",
        },
        {
          id: 1,
          __entity_type__: "Task",
        },
        {
          id: 2,
          __entity_type__: "Task",
          name: "bar",
        },
      ]);
      expect(data[0].name).toEqual("foo");
      expect(data[1].name).toEqual("foo");
      expect(data[2].name).toEqual("bar");
    });

    it("Should support merging 1-level nested data", async () => {
      await session.initializing;

      //@ts-ignore - Otherwise internal method used for testing purposes
      const data = session.decode([
        {
          id: 1,
          __entity_type__: "Task",
          name: "foo",
          status: {
            __entity_type__: "Status",
            id: 2,
            name: "In progress",
          },
        },
        {
          id: 2,
          __entity_type__: "Task",
          name: "foo",
          status: {
            __entity_type__: "Status",
            id: 1,
            name: "Done",
          },
        },
        {
          id: 3,
          __entity_type__: "Task",
          status: {
            __entity_type__: "Status",
            id: 1,
          },
        },
      ]);
      expect(data[0].status.name).toEqual("In progress");
      expect(data[1].status.name).toEqual("Done");
      expect(data[2].status.name).toEqual("Done");
    });

    it("Should support merging 2-level nested data", async () => {
      await session.initializing;

      //@ts-ignore - Otherwise internal method used for testing purposes
      const data = session.decode([
        {
          id: 1,
          __entity_type__: "Task",
          name: "foo",
          status: {
            __entity_type__: "Status",
            id: 1,
            state: {
              __entity_type__: "State",
              id: 1,
              short: "DONE",
            },
          },
        },
        {
          id: 2,
          __entity_type__: "Task",
          status: {
            __entity_type__: "Status",
            id: 2,
            state: {
              __entity_type__: "State",
              id: 2,
              short: "NOT_STARTED",
            },
          },
        },
        {
          id: 3,
          __entity_type__: "Task",
          status: {
            __entity_type__: "Status",
            id: 1,
            state: {
              __entity_type__: "State",
              id: 1,
            },
          },
        },
      ]);
      expect(data[0].status.state.short).toEqual("DONE");
      expect(data[1].status.state.short).toEqual("NOT_STARTED");
      expect(data[2].status.state.short).toEqual("DONE");
    });

    it("Should support decoding datetime as dayjs (default)", () => {
      const now = dayjs();

      //@ts-ignore - Otherwise internal method used for testing purposes
      const output = session.decode({
        foo: {
          __type__: "datetime",
          value: now.toISOString(),
        },
      });
      expect(output.foo).toBeInstanceOf(dayjs);
      expect(output.foo.toISOString()).toEqual(now.toISOString());
    });

    it("Should support decoding datetime as ISO string", () => {
      const now = new Date();

      //@ts-ignore - Otherwise internal method used for testing purposes
      const output = session.decode(
        {
          foo: {
            __type__: "datetime",
            value: now.toISOString(),
          },
        },
        {},
        { decodeDatesAsIso: true },
      );
      expect(output.foo).toEqual(now.toISOString());
    });
  });

  it("Should support encoding Date object dates", () => {
    const now = new Date();

    //@ts-ignore - Otherwise internal method used for testing purposes
    const output = session.encode([{ foo: now, bar: "baz" }, 12321]);
    expect(output).toEqual([
      {
        foo: {
          __type__: "datetime",
          value: now.toISOString(),
        },
        bar: "baz",
      },
      12321,
    ]);
  });
});

describe("Prepared template tests", () => {
  it("escapes single quotes in interpolated values", () => {
    const result = expression`It's ${"amazing"} here.`;
    expect(result).toBe("It's amazing here.");
  });

  it("escapes double quotes in interpolated values", () => {
    const result = expression`She said, ${'"Hello!"'} to him.`;
    expect(result).toBe('She said, \\"Hello!\\" to him.');
  });

  it("escapes quotes when mixing multiple types", () => {
    const result = expression`Quotes: ${`"begin and end'`}.`;
    expect(result).toBe(`Quotes: \\"begin and end\\'.`);
  });

  it("works with multiple interpolated values", () => {
    const result = expression`This is ${"first"} and this is ${"second"}.`;
    expect(result).toBe("This is first and this is second.");
  });

  it("works without any interpolated values", () => {
    const result = expression`Just a string without any interpolation.`;
    expect(result).toBe("Just a string without any interpolation.");
  });

  it("works with empty string as interpolated value", () => {
    const result = expression`This is an ${""} empty value.`;
    expect(result).toBe("This is an  empty value.");
  });
  it("handles no arguments", () => {
    const result = expression``;
    expect(result).toBe("");
  });
  it("handles backslashes in interpolated values", () => {
    const result = expression`This is a backslash: ${"\\"}.`;
    expect(result).toBe("This is a backslash: \\.");
  });
  it("handles unusual characters", () => {
    const result = expression`${"æøåßđŋħłøœŧźżšđžčćñé.,;:!?()[]{}<></>+-*/=<>^%&|~©®™µƒ∂∆πΣΩ$€£¥¢₹₽😀😍🤖👍❤️"}`;
    expect(result).toBe(
      "æøåßđŋħłøœŧźżšđžčćñé.,;:!?()[]{}<></>+-*/=<>^%&|~©®™µƒ∂∆πΣΩ$€£¥¢₹₽😀😍🤖👍❤️",
    );
  });
});
