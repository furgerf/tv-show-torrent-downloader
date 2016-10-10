'use strict';

const root = './../../src/';

var expect = require('chai').expect,
  rewire = require('rewire'),

  testUtils = require('../test-utils'),
  Piratebay = rewire(root + 'torrent-sites/piratebay');

describe('torrent-sites/piratebay', function () {
  describe('constructor', function () {

    it('should throw an error if no URL is provided', function () {
      // must pass a function to expect that throws the exception
      expect(function () {new Piratebay()}).to.throw(Error);
    });
  });

  describe('static parse functions', function () {
    var parseSize = Piratebay.__get__('parseSize'),
        parseDateThisYear = Piratebay.__get__('parseDateThisYear'),
        parseDateLastYear = Piratebay.__get__('parseDateLastYear'),
        parseDateToday = Piratebay.__get__('parseDateToday'),
        parseDate = Piratebay.__get__('parseDate');

    it('should correctly parse various sizes');

    it('should correctly parse a date this year', function () {
      expect(parseDateThisYear(['foobar', '1', '2', '3', '4'])).to.eql(new Date(new Date().getFullYear(), 0, 2, 3, 4));
    });

    it('should correctly parse a date last year', function () {
      expect(parseDateLastYear(['foobar', '1', '2', '3'])).to.eql(new Date(1903, 0, 2));
    });

    it('should correctly parse a date today', function () {
      var now = new Date();

      expect(parseDateToday(['foobar', '1', '2'])).to.eql(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 1, 2));
    });

    it('should correctly parse any date string');
  });

  describe('parseTorrentData', function () {
    var testee = new Piratebay('asdf', testUtils.getFakeLog());

    it('should handle invalid data', function () {
      expect(testee.parseTorrentData()).to.be.null;
      expect(testee.parseTorrentData(123)).to.be.null;
      expect(testee.parseTorrentData({})).to.be.null;
      expect(testee.parseTorrentData([])).to.be.null;
    });

    it('should handle data without torrents', function () {
      expect(testee.parseTorrentData('asdf')).to.eql([]);
      // TODO: Add HTML of real site without torrents here
    });

    it('should correctly parse html data with one torrent');

    it('should correctly parse html data with multiple torrents');
  });
});

