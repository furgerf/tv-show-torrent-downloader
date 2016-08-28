'use strict';

// /*global describe*/

var should = require('chai').should(),

    config = require('../src/common/config'),
    apiUrl = 'http://' + config.api.host + ':' + config.api.port + '/',

    server = require('supertest').agent(apiUrl);

describe('entry - say hello! :-)', function () {
  it('should be redirected on root', function (done) {
    server
      .get('')
      .expect('Content-type', 'application/json')
      .expect(302)
      .end(function (err, res) {
        should.not.exist(err);
        should.not.exist(res.result);
        done();
      });
  });
});

