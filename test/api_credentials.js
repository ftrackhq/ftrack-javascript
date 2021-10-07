import loglevel from "loglevel";

const logger = loglevel.getLogger("test:api_credentials");

const { FTRACK_SERVER } = process.env;
const { FTRACK_API_USER } = process.env;
const { FTRACK_API_KEY } = process.env;
const credentials = {
  serverUrl: FTRACK_SERVER,
  apiUser: FTRACK_API_USER,
  apiKey: FTRACK_API_KEY,
};

if (!FTRACK_SERVER || !FTRACK_API_USER || !FTRACK_API_KEY) {
  logger.warn("Using credentials", credentials);
  throw new Error(`Failed to get API credentials.

        Please set the environment variables:

            * FTRACK_SERVER
            * FTRACK_API_USER
            * FTRACK_API_KEY
    `);
}

logger.debug("Using credentials", credentials);
export default credentials;
