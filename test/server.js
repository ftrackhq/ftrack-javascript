import { rest } from "msw"; // msw supports graphql too!
import { setupServer } from "msw/node";

const handlers = [
  rest.post("http://ftrack.test/api", async (req, res, ctx) => {
    console.log("hej", req);
    return res(ctx.json({ hej: "hej" }));
  }),
];

const server = setupServer(...handlers);

export { server, rest };
