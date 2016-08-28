'use strict';

// /*global describe*/

var should = require('chai').should(),
    api = require('./../src/app'),
    server;

describe('entry - say hello! :-)', function () {
  beforeEach(function (done) {
    api.listen(0, 'localhost', function () {
      var url = 'http://' + this.address().address + ':' + this.address().port;
      server = require('supertest').agent(url);
      done();
    });
  });
  afterEach(function (done) {
    api.close(done);
  });

  it('should be redirected on root', function (done) {
    server
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
    server
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

