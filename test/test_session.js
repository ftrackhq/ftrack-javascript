// :copyright: Copyright (c) 2016 ftrack

import { Session } from 'session';
import uuid from 'uuid';
import loglevel from 'loglevel';
import credentials from './api_credentials';

const logger = loglevel.getLogger('test_session');

describe('Session', () => {
    let session = null;

    logger.debug('Running session tests.');

    before(() => {
        session = new Session(
            credentials.serverUrl, credentials.apiUser, credentials.apiKey,
            { autoConnectEventHub: false }
        );
    });

    it('Should initialize the session automatically', (done) => {
        expect(session.initialized).to.be.false;
        session.initializing.then(() => {
            expect(session.initialized).to.be.true;
            done();
        });
    });

    it('Should allow querying a Task', (done) => {
        const promise = session.query('select name from Task limit 1');
        promise.then((response) => {
            const entityType = response.data[0].__entity_type__;
            entityType.should.deep.equal('Task');
            done();
        });
    });

    it('Should allow creating a User', (done) => {
        const promise = session.create('User', {
            username: uuid.v4(),
        });

        promise.then((response) => {
            const entityType = response.data.__entity_type__;
            entityType.should.deep.equal('User');
            done();
        });
    });

    it('Should allow deleting a User', (done) => {
        const username = uuid.v4();
        const promise = session.create('User', {
            username,
        });

        promise.then((newUserResponse) => {
            const userId = newUserResponse.data.id;

            const deletePromise = session.delete(
                'User', userId
            );

            deletePromise.then(() => {
                done();
            });
        });
    });

    it('Should allow updating a User', (done) => {
        const username = uuid.v4();
        const promise = session.create('User', {
            username,
        });

        promise.then((newUserResponse) => {
            const userId = newUserResponse.data.id;
            const newUsername = uuid.v4();

            const updatePromise = session.update(
                'User',
                userId,
                {
                    username: newUsername,
                }
            );

            updatePromise.then((response) => {
                response.data.username.should.deep.equal(newUsername);
                done();
            });
        });
    });
});
