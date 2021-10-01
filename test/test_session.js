// :copyright: Copyright (c) 2016 ftrack

import { ServerPermissionDeniedError, ServerValidationError, ServerError } from '../source/error';
import { Session } from '../source/session';
import operation from '../source/operation';
import uuidV4 from 'uuid/v4';
import loglevel from 'loglevel';
import moment from 'moment';
import credentials from './api_credentials';

const logger = loglevel.getLogger('test_session');
logger.setLevel('debug');

describe('Session', () => {
    let session = null;

    logger.debug('Running session tests.');

    before(() => {
        session = new Session(
            credentials.serverUrl, credentials.apiUser, credentials.apiKey,
            { autoConnectEventHub: false }
        );
        return session;
    });

    it('Should initialize the session automatically', () => {
        expect(session.initialized).to.be.false;
        return expect(
            session.initializing.then((_session) => _session.initialized)
        ).to.eventually.be.true;
    });

    it('Should reject invalid credentials', () => {
        const badSession = new Session(
            credentials.serverUrl, credentials.apiUser, 'INVALID_API_KEY',
            { autoConnectEventHub: false }
        );
        return expect(badSession.initializing).to.be.rejectedWith(ServerError);
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
            username: uuidV4(),
        });

        return expect(
            promise.then(
                (response) => response.data.__entity_type__
            )
        ).to.eventually.be.equal('User');
    });

    it('Should allow deleting a User', () => {
        const username = uuidV4();
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
        const username = uuidV4();
        const newUsername = uuidV4();
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
        }).then(done, done);
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
        }).then(done);
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
        }).then(done);
    });

    it('Should support api query 2-level nested data', (done) => {
        const promise = session.query(
            'select status.state.short from Task where status.state.short is NOT_STARTED limit 2'
        );
        promise.then((response) => {
            const data = response.data;
            data[0].status.state.short.should.deep.equal('NOT_STARTED');
            data[1].status.state.short.should.deep.equal('NOT_STARTED');

            data[0].status.state.should.equal(data[1].status.state);
        }).then(done);
    });

    it('Should decode batched query operations', (done) => {
        const promise = session.call([
            operation.query(
                'select status.state.short from Task where status.state.short is NOT_STARTED limit 1'
            ),
            operation.query(
                'select status.state.short from Task where status.state.short is NOT_STARTED limit 1'
            ),
        ]);
        promise.then((responses) => {
            const status1 = responses[0].data[0].status;
            const status2 = responses[1].data[0].status;
            status1.state.short.should.deep.equal('NOT_STARTED');
            status2.state.short.should.deep.equal('NOT_STARTED');
            status1.should.equal(status2);
        }).then(done, done);
    });

    it('Should decode self-referencing entities', (done) => {
        const request = session.query(
            'select version, asset.versions.version from AssetVersion where asset_id is_not None limit 1'
        );

        request.then(response => {
            const versionNumber = response.data[0].version;
            const versionId = response.data[0].id;
            const assetVersions = response.data[0].asset.versions;
            const versionNumber2 = assetVersions.find(item => item.id === versionId).version;
            versionNumber.should.deep.equal(versionNumber2);
        }).then(done, done);
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
        }).then(done);
    });

    it.skip('Should support abort of uploading file', (done) => {
        const data = { foo: 'bar' };
        const blob = new Blob(
            [JSON.stringify(data)], { type: 'application/json' }
        );
        blob.name = 'data.json';
        const xhr = new XMLHttpRequest();
        const onAborted = () => { done(); };

        session.createComponent(blob, { xhr,
            onProgress: () => { xhr.abort(); }, onAborted });
    });

    it('Should support ensure with create', (done) => {
        const identifyingKeys = ['key', 'parent_id', 'parent_type'];
        const key = uuidV4();

        let user;
        const promise = session.initializing.then(
            () => session.query(`select id from User where username is "${session.apiUser}"`)
        ).then(
            ({ data }) => {
                user = data[0];
                return session.ensure(
                    'Metadata',
                    {
                        key, value: 'foo', parent_id: user.id, parent_type: 'User',
                    },
                    identifyingKeys
                );
            }
        );
        promise.then((data) => {
            try {
                data.__entity_type__.should.equal('Metadata');
                data.key.should.equal(key);
                data.value.should.equal('foo');
                data.parent_id.should.equal(user.id);
                data.parent_type.should.equal('User');
            } catch (error) {
                done(error);
            }
        }).then(done);
    });

    it('Should support ensure with update', (done) => {
        const identifyingKeys = ['key', 'parent_id', 'parent_type'];
        const key = uuidV4();

        let user;
        const promise = session.initializing.then(
            () => session.query(`select id from User where username is "${session.apiUser}"`)
        ).then(
            ({ data }) => {
                user = data[0];
                return session.create('Metadata', {
                    key, value: 'foo', parent_id: user.id, parent_type: 'User',
                });
            }
        ).then(
            () => session.ensure(
                'Metadata',
                {
                    key, value: 'bar', parent_id: user.id, parent_type: 'User',
                },
                identifyingKeys
            )
        );
        promise.then((data) => {
            try {
                data.__entity_type__.should.equal('Metadata');
                data.key.should.equal(key);
                data.value.should.equal('bar');
                data.parent_id.should.equal(user.id);
                data.parent_type.should.equal('User');
            } catch (error) {
                done(error);
            }
        }).then(done);
    });

    it('Should support ensure with update moment object as criteria', (done) => {
        const now = moment();

        const name = uuidV4();

        const promise = session.initializing.then(
            () => session.create('Project', {
                start_date: now, end_date: now, name, full_name: 'foo',
            })
        ).then(
            () => session.ensure(
                'Project',
                {
                    start_date: now, end_date: now, name, full_name: 'bar',
                },
                ['start_date']
            )
        );
        promise.then((data) => {
            try {
                data.__entity_type__.should.equal('Project');
                data.full_name.should.equal('bar');
            } catch (error) {
                done(error);
            }
        }).then(done);
    });

    it('Should support uploading files with custom component id', (done) => {
        const componentId = uuidV4();
        const data = { foo: 'bar' };
        const blob = new Blob(
            [JSON.stringify(data)], { type: 'application/json' }
        );
        blob.name = 'data.json';

        const promise = session.createComponent(blob, { data: { id: componentId } });
        promise.then((response) => {
            response[0].data.id.should.equal(componentId);
        }).then(done);
    });

    it('Should support generating thumbnail URL with + in username', () => {
        const componentId = uuidV4();
        const previousUser = session.apiUser;
        session.apiUser = 'user+test@example.com';
        const url = session.thumbnailUrl(componentId);
        url.should.equal(
            `${credentials.serverUrl}/component/thumbnail?` +
            `id=${componentId}&size=300` +
            `&username=${encodeURIComponent(session.apiUser)}` +
            `&apiKey=${credentials.apiKey}`
        );
        session.apiUser = previousUser;
    });

    it('Should support encoding moment dates', () => {
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
    });

    it('Should return correct error', () => {
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
    });
});
