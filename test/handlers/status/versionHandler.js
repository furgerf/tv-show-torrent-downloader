'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  supertest = require('supertest'),
  rewire = require('rewire'),
  sinon = require('sinon'),

  App = require(root + 'app'),
  config = require(root + 'common/config').getDebugConfig(),
  testUtils = require(root + '../test/test-utils'),
  RewiredVersionHandler = rewire(root + 'handlers/status/versionHandler');

config.api.port = 0;

describe('VersionHandler', function () {
  describe('getNpmVersion', function () {
    var getNpmVersion = RewiredVersionHandler.__get__('getNpmVersion');

    it('should return a version number in the major.minor.build format', function () {
      var npmVersion = getNpmVersion(),
        versionRegex = /^(\d+)\.(\d+)\.(\d+)$/;

      // executing this test through npm, then the NPM verison will be set
      // but the test could also be executed without npm, in which casse it's undefined
      if (npmVersion === undefined) {
        return;
      }

      expect(npmVersion).to.match(versionRegex);
    });
  });

  describe('getGitRevision', function () {
    var getGitRevision = RewiredVersionHandler.__get__('getGitRevision');

    it('should return a git revision hash', function () {
      var gitRevision = getGitRevision(),
        revisionRegex = /^[0-9a-f]{40}$/;
      // TODO: Replace regex in square braces with hex char

      expect(gitRevision).to.match(revisionRegex);
    });
  });

  describe('requests', function () {
    var server,
      app;

    describe('GET /status/version', function () {
      var testNpmVersion = '1.2.3',
        testGitRevision = 'fce2559203ae926870179b4d677418d5aaac300e',

        getNpmVersionStub = sinon.stub(),
        getGitRevisionStub = sinon.stub();

      getNpmVersionStub.returns(testNpmVersion);
      getGitRevisionStub.returns(testGitRevision);

      beforeEach(function (done) {
        getNpmVersionStub.reset();
        getGitRevisionStub.reset();

        RewiredVersionHandler.__set__('getNpmVersion', getNpmVersionStub);
        RewiredVersionHandler.__set__('getGitRevision', getGitRevisionStub);

        // create app and replace handler
        app = new App(config, testUtils.getFakeLog());
        app.versionHandler = new RewiredVersionHandler(testUtils.getFakeLog());

        // start server
        app.listen(function () {
          var url = 'http://' + this.address().address + ':' + this.address().port;
          server = supertest.agent(url);
          done();
        });
      });

      afterEach(function (done) {
        app.close(done);
      });

      it('should correctly return testdata', function (done) {
        server
          .get('/status/version')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql({
              version: testNpmVersion,
              revision: testGitRevision
            });
            done();
          });
      });
    });
  });
});

