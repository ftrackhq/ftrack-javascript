import loglevel from 'loglevel';

const logger = loglevel.getLogger('test:api_credentials');

const FTRACK_SERVER = process.env.FTRACK_SERVER;
const FTRACK_API_USER = process.env.FTRACK_API_USER;
const FTRACK_API_KEY = process.env.FTRACK_API_KEY;
const credentials = {
    serverUrl: FTRACK_SERVER,
    apiUser: FTRACK_API_USER,
    apiKey: FTRACK_API_KEY,
};

if (!FTRACK_SERVER || !FTRACK_API_USER || !FTRACK_API_KEY) {
    logger.warn('Using credentials', credentials);
    throw new Error(`Failed to get API credentials.

        Please set the environment variables:

            * FTRACK_SERVER
            * FTRACK_API_USER
            * FTRACK_API_KEY
    `);
}

logger.debug('Using credentials', credentials);
export default credentials;
