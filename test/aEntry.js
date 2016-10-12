'use strict';

var expect = require('chai').expect,
  supertest = require('supertest'),

  App = require('./../src/app'),
  config = require('./../src/common/config').getDebugConfig(),
  testUtils = require('./test-utils');

config.api.port = 0;

describe('entry', function () {
  describe('accessing root', function () {
    var server,
      app;

    beforeEach(function (done) {
      app = new App(config, testUtils.getFakeLog());

      app.listen(function () {
        var url = 'http://' + this.address().address + ':' + this.address().port;
        server = supertest.agent(url);
        done();
      });
    });

    afterEach(function (done) {
      app.close(done);
    });

    it('should be redirected on root', function (done) {
      server
        .get('/')
        .expect('Content-type', 'application/json')
        .expect(302)
        .end(function (err, res) {
          expect(err).to.not.exist;
          expect(res.result).to.not.exist;
          done();
        });
    });

    it('should also work on a second request', function (done) {
      server
        .get('/')
        .expect('Content-type', 'application/json')
        .expect(302)
        .end(function (err, res) {
          expect(err).to.not.exist;
          expect(res.result).to.not.exist;
          done();
        });
    });
  });
});

