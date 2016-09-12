'use strict';

// /*global describe*/

var should = require('chai').should(),
  config = require('./../src/common/config').getDebugConfig(),
  App = require('./../src/app').App,
  logger = require('./../src/common/logger'),
  server;

config.api.port = 0;
config.logging.stdoutLoglevel = 'error';

describe('entry - say hello! :-)', function () {
  beforeEach(function (done) {
    var that = this;
    this.app =
      new App(config, logger.createLogger(config.logging).child({component: 'test-server'}));

    this.app.listen(function () {
      var url = 'http://' + this.address().address + ':' + this.address().port;
      that.server = require('supertest').agent(url);
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
        should.not.exist(err);
        should.not.exist(res.result);
        done();
      });
  });

  it('should should also work on a second request', function (done) {
    this.server
      .get('/')
      .expect('Content-type', 'application/json')
      .expect(302)
      .end(function (err, res) {
        should.not.exist(err);
        should.not.exist(res.result);
        done();
      });
  });
});

