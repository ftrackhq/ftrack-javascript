// :copyright: Copyright (c) 2016 ftrack

import Session from './session';


export { Event, EventHub } from './event';
export { Session } from './session';

/** Shared API session instance. */
export let session = null;

/**
 * Configure shared session instance.
 *
 * Returns promise which will be resolved once session is ready for use.
 */
export function configureSharedApiSession(
    serverUrl, apiUser, apiKey
) {
    session = new Session(
        serverUrl, apiUser, apiKey, { autoConnectEventHub: true }
    );
    return session.initialize();
}
