'use strict';

var should = require('chai').should(),
    rewire = require('rewire'),
    testee = rewire('../../src/torrent-sites/piratebay');

describe('torrent-sites/piratebay', function () {
  describe('static parse functions', function () {
    var parseSize = testee.__get__('parseSize'),
        parseDateThisYear = testee.__get__('parseDateThisYear');

    it('should correctly parse a date this year', function () {
      parseDateThisYear(["foobar", "1", "2", "3", "4"]).should.eql(new Date(new Date().getFullYear(), 0, 2, 3, 4));
    });
  });
});

