import chai from 'chai';
import Session from '../lib/ftrack-api.js';

chai.expect();

const expect = chai.expect;

var session;

describe('Given an instance of my library', function () {
  before(function () {
    session = new Session();
  });
  describe('when I need the name', function () {
    it('should return the name', () => {
      expect(session.name).to.be.equal('Session');
    });
  });
});