// :copyright: Copyright (c) 2016 ftrack

import { Session } from 'session';
import uuid from 'uuid';
import loglevel from 'loglevel';
import credentials from './api_credentials';

const logger = loglevel.getLogger('test_session');
logger.setLevel("debug");

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

    it('Should support merging 0-level nested data', (done) => {
        const data = session.merge([
            {
                id: 1,
                __entity_type__: 'Task',
                name: 'foo',
            }, {
                id: 1,
                __entity_type__: 'Task',
            }, {
                id: 2,
                __entity_type__: 'Task',
                name: 'bar',
            },
        ]);
        data[0].name.should.deep.equal('foo');
        data[1].name.should.deep.equal('foo');
        data[2].name.should.deep.equal('bar');
        done();
    });

    it('Should support merging 1-level nested data', (done) => {
        const data = session.merge([
            {
                id: 1,
                __entity_type__: 'Task',
                name: 'foo',
                status: {
                    __entity_type__: 'Status',
                    id: 2,
                    name: 'In progress',
                },
            }, {
                id: 2,
                __entity_type__: 'Task',
                name: 'foo',
                status: {
                    __entity_type__: 'Status',
                    id: 1,
                    name: 'Done',
                },
            }, {
                id: 3,
                __entity_type__: 'Task',
                status: {
                    __entity_type__: 'Status',
                    id: 1,
                },
            },
        ]);
        data[0].status.name.should.deep.equal('In progress');
        data[1].status.name.should.deep.equal('Done');
        data[2].status.name.should.deep.equal('Done');
        done();
    });

    it('Should support merging 2-level nested data', (done) => {
        const data = session.merge([
            {
                id: 1,
                __entity_type__: 'Task',
                name: 'foo',
                status: {
                    __entity_type__: 'Status',
                    id: 1,
                    state: {
                        __entity_type__: 'State',
                        id: 1,
                        short: 'DONE',
                    },
                },
            }, {
                id: 2,
                __entity_type__: 'Task',
                status: {
                    __entity_type__: 'Status',
                    id: 2,
                    state: {
                        __entity_type__: 'State',
                        id: 2,
                        short: 'NOT_STARTED',
                    },
                },
            }, {
                id: 3,
                __entity_type__: 'Task',
                status: {
                    __entity_type__: 'Status',
                    id: 1,
                    state: {
                        __entity_type__: 'State',
                        id: 1,
                    },
                },
            },
        ]);
        data[0].status.state.short.should.deep.equal('DONE');
        data[1].status.state.short.should.deep.equal('NOT_STARTED');
        data[2].status.state.short.should.deep.equal('DONE');
        done();
    });

    it('Should support api query 2-level nested data', (done) => {
        const promise = session.query(
            'select status.state.short from Task where status.state.short is NOT_STARTED limit 2'
        );
        promise.then((response) => {
            const data = response.data;
            data[0].status.state.short.should.deep.equal('NOT_STARTED');
            data[1].status.state.short.should.deep.equal('NOT_STARTED');

            data[0].status.should.equal(data[1].status);

            done();
        });
    });
});
