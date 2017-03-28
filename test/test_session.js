// :copyright: Copyright (c) 2016 ftrack

import { ServerPermissionDeniedError, ServerValidationError, ServerError } from 'error';
import { Session } from 'session';
import operation from 'operation';
import uuid from 'uuid';
import loglevel from 'loglevel';
import moment from 'moment';
import credentials from './api_credentials';

const logger = loglevel.getLogger('test_session');
logger.setLevel("debug");

describe('Session', () => {
    let session = null;

    logger.debug('Running session tests.');

    beforeEach(() => {
        session = new Session(
            credentials.serverUrl, credentials.apiUser, credentials.apiKey,
            { autoConnectEventHub: false }
        );
    });

    it('Should reject invalid credentials', () => {
        const badSession = new Session(
            credentials.serverUrl, credentials.apiUser, 'INVALID_API_KEY',
            { autoConnectEventHub: false }
        );
        return expect(badSession.initializing).to.be.rejectedWith(ServerError);
    });

    it('Should initialize the session automatically', () => {
        expect(session.initialized).to.be.false;
        return expect(
            session.initializing.then((_session) => _session.initialized)
        ).to.eventually.be.true;
    });

    it('Should allow querying a Task', () => {
        return expect(
            session.query('select name from Task limit 1').then(
                (response) => response.data[0].__entity_type__
            )
        ).to.eventually.be.equal('Task');
    });

    it('Should allow creating a User', () => {
        const promise = session.create('User', {
            username: uuid.v4(),
        });

        return expect(
            promise.then(
                (response) => response.data.__entity_type__
            )
        ).to.eventually.be.equal('User');
    });

    it('Should allow deleting a User', () => {
        const username = uuid.v4();
        let promise = session.create('User', {
            username,
        });

        promise = promise.then((newUserResponse) => {
            const userId = newUserResponse.data.id;
            const deletePromise = session.delete(
                'User', userId
            );
            return deletePromise;
        });

        return expect(
            promise.then(
                (response) => response.data
            )
        ).to.eventually.be.true;
    });

    it('Should allow updating a User', () => {
        const username = uuid.v4();
        const newUsername = uuid.v4();
        let promise = session.create('User', {
            username,
        });

        promise = promise.then((newUserResponse) => {
            const userId = newUserResponse.data.id;
            const updatePromise = session.update(
                'User',
                userId,
                {
                    username: newUsername,
                }
            );

            return updatePromise;
        });

        return expect(
            promise.then(
                (response) => response.data.username
            )
        ).to.eventually.be.equal(newUsername);
    });

    it('Should support merging 0-level nested data', (done) => {
        session.initializing.then(() => {
            const data = session.decode([
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
    });

    it('Should support merging 1-level nested data', (done) => {
        session.initializing.then(() => {
            const data = session.decode([
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
    });

    it('Should support merging 2-level nested data', (done) => {
        session.initializing.then(() => {
            const data = session.decode([
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
        }, (rejection) => { done(rejection); });
    });

    it('Should decode batched query operations', () => {
        const promise = session.call([
            operation.query(
                'select status.state.short from Task where status.state.short is NOT_STARTED limit 1'
            ),
            operation.query(
                'select status.state.short from Task where status.state.short is NOT_STARTED limit 1'
            ),
        ]);
        return promise.then((responses) => {
            const status1 = responses[0].data[0].status;
            const status2 = responses[1].data[0].status;
            status1.state.short.should.deep.equal('NOT_STARTED');
            status2.state.short.should.deep.equal('NOT_STARTED');
            return status1.should.equal(status2);
        });
    });

    it('Should decode self-referencing entities', () => {
        const request = session.query(
            'select version, asset.versions.version from AssetVersion where asset_id is_not None limit 1'
        );

        return request.then(response => {
            const versionNumber = response.data[0].version;
            const versionId = response.data[0].id;
            const assetVersions = response.data[0].asset.versions;
            const versionNumber2 = assetVersions.find(item => item.id === versionId).version;
            return versionNumber.should.deep.equal(versionNumber2);
        });
    });

    it('Should support uploading files', (done) => {
        const data = { foo: 'bar' };
        const blob = new Blob(
            [JSON.stringify(data)], { type: 'application/json' }
        );
        blob.name = 'data.json';

        const promise = session.createComponent(blob);
        promise.then((response) => {
            response[0].data.__entity_type__.should.equal('FileComponent');
            response[0].data.file_type.should.equal('.json');
            response[0].data.name.should.equal('data');

            // TODO: Read file back and verify the data. This is currently not
            // possible due to being a cors request.
            done();
        }, (rejection) => { done(rejection); });
    });

    it('Should support uploading files with custom component id', (done) => {
        const componentId = uuid.v4();
        const data = { foo: 'bar' };
        const blob = new Blob(
            [JSON.stringify(data)], { type: 'application/json' }
        );
        blob.name = 'data.json';

        const promise = session.createComponent(blob, { data: { id: componentId } });
        promise.then((response) => {
            response[0].data.id.should.equal(componentId);
            done();
        }, (rejection) => { done(rejection); });
    });

    it('Should support encoding moment dates', (done) => {
        const now = moment();
        const output = session.encode([{ foo: now, bar: 'baz' }, 12321]);
        output.should.deep.equal(
            [
                {
                    foo: { __type__: 'datetime', value: now.format('YYYY-MM-DDTHH:mm:ss') },
                    bar: 'baz',
                },
                12321,
            ]
        );
        done();
    });

    it('Should return correct error', (done) => {
        expect(
            session.getErrorFromResponse({
                exception: 'PermissionError',
                content: 'foo',
            })
        ).to.be.instanceof(ServerPermissionDeniedError);
        expect(
            session.getErrorFromResponse({
                exception: 'FTAuthenticationError',
                content: 'foo',
            })
        ).to.be.instanceof(ServerPermissionDeniedError);
        expect(
            session.getErrorFromResponse({
                exception: 'ValidationError',
                content: 'foo',
            })
        ).to.be.instanceof(ServerValidationError);
        expect(
            session.getErrorFromResponse({
                exception: 'Foo',
                content: 'foo',
            })
        ).to.be.instanceof(ServerError);

        done();
    });
});
