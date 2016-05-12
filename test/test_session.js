import { Session } from 'session';


describe('Session', () => {
    let session = null;

    before(() => {
        session = new Session(
            'http://ftrack.dev:8090',
            'bjorn.rydahl',
            '9f0e3849-83bc-496f-95cd-441662b55cff',
            false
        );
    });

    it('Should allow querying a Task', (done) => {
        const response = session._query('select name from Task limit 1');
        response.then((operation) => {
            const entityType = operation.data[0].__entity_type__;
            entityType.should.deep.equal('Task');
            done();
        });
    });
});
