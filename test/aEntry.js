'use strict';

var expect = require('chai').expect,
  supertest = require('supertest'),

  App = require('./../src/app').App,
  config = require('./../src/common/config').getDebugConfig(),
  testUtils = require('./test-utils'),

  server;

config.api.port = 0;

describe('entry', function () {
  describe('accessing root', function () {
    beforeEach(function (done) {
      var that = this;
      this.app =
        new App(config, testUtils.getFakeLog());

      this.app.listen(function () {
        var url = 'http://' + this.address().address + ':' + this.address().port;
        that.server = supertest.agent(url);
        done();
      });
    });

    afterEach(function (done) {
      this.app.close(done);
    });

    it('should be redirected on root', function (done) {
      this.server
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
      this.server
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

