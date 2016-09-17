'use strict';

// /*global describe*/

var expect = require('chai').expect,
  config = require('./../src/common/config').getDebugConfig(),
  App = require('./../src/app').App,
  logger = require('./../src/common/logger'),
  supertest = require('supertest'),
  server;

config.api.port = 0;
config.logging.stdoutLoglevel = 'error';

describe('entry', function () {
  describe('accessing root', function () {
    beforeEach(function (done) {
      var that = this;
      this.app =
        new App(config, logger.createLogger(config.logging).child({component: 'test-server'}));

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

