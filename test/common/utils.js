'use strict';

const root = '../../src/';

var expect = require('chai').expect,
  sinon = require('sinon'),
  rewire = require('rewire'),
  utils = rewire(root + 'common/utils');

describe('utils', function () {
  describe('twoDigitNumber', function () {
    var twoDigitNumber = utils.__get__('twoDigitNumber');

    it('should return undefined if invoked without a number', function () {
      expect(twoDigitNumber(null)).to.be.undefined;
      expect(twoDigitNumber(undefined)).to.be.undefined;
      expect(twoDigitNumber('abc')).to.be.undefined;
      expect(twoDigitNumber('a')).to.be.undefined;
      expect(twoDigitNumber('')).to.be.undefined;
    });

    it('should return two digits when invoked with (parsable) numbers', function () {
      expect(twoDigitNumber(0)).to.eql('00');
      expect(twoDigitNumber(1)).to.eql('01');
      expect(twoDigitNumber(-1)).to.eql('-1');
      expect(twoDigitNumber(12)).to.eql('12');
      expect(twoDigitNumber(-12)).to.eql('12'); // hmm...
      expect(twoDigitNumber(123)).to.eql('23');
      expect(twoDigitNumber(-123)).to.eql('23'); // hmm...
      expect(twoDigitNumber('123')).to.eql('23');
    });
  });

  describe('formatEpisodeNumber', function () {
    it('should return undefined if invoked with invalid arguments', function () {
      expect(utils.formatEpisodeNumber(0)).to.be.undefined;
      expect(utils.formatEpisodeNumber(null, 0)).to.be.undefined;
      expect(utils.formatEpisodeNumber(undefined, 0)).to.be.undefined;
      expect(utils.formatEpisodeNumber(null, null)).to.be.undefined;
      expect(utils.formatEpisodeNumber(12, 'ab')).to.be.undefined;
      expect(utils.formatEpisodeNumber('', 34)).to.be.undefined;
    });

    it('should return the correct string if invoked with valid arguments', function () {
      expect(utils.formatEpisodeNumber(0, 0)).to.eql('S00E00');
      expect(utils.formatEpisodeNumber(0, 5)).to.eql('S00E05');
      expect(utils.formatEpisodeNumber(5, 0)).to.eql('S05E00');
      expect(utils.formatEpisodeNumber(-2, 0)).to.eql('S-2E00');
      expect(utils.formatEpisodeNumber(0, -2)).to.eql('S00E-2');
      expect(utils.formatEpisodeNumber(-2, 5)).to.eql('S-2E05');
      expect(utils.formatEpisodeNumber(12, 34)).to.eql('S12E34');
    });
  });

  describe('fileSizeToBytes', function () {
    it('should return undefined if the number argument is invalid', function () {
      expect(utils.fileSizeToBytes(null, 'KiB')).to.be.undefined;
      expect(utils.fileSizeToBytes(undefined, 'MiB')).to.be.undefined;
      expect(utils.fileSizeToBytes('', 'GiB')).to.be.undefined;
      expect(utils.fileSizeToBytes('a', 'KB')).to.be.undefined;
    });

    it('should return undefined if the unit argument is invalid', function () {
      expect(utils.fileSizeToBytes(12, 'TiB')).to.be.undefined;
      expect(utils.fileSizeToBytes(34, 'TB')).to.be.undefined;
      expect(utils.fileSizeToBytes(56, 'abc')).to.be.undefined;
      expect(utils.fileSizeToBytes(78, '')).to.be.undefined;
      expect(utils.fileSizeToBytes(90, null)).to.be.undefined;
    });

    it('should return the file size if invoked with valid arguments', function () {
      expect(utils.fileSizeToBytes(0, 'KiB')).to.eql(0);
      expect(utils.fileSizeToBytes(0, 'MiB')).to.eql(0);
      expect(utils.fileSizeToBytes(0, 'GiB')).to.eql(0);
      expect(utils.fileSizeToBytes(0, 'KB')).to.eql(0);
      expect(utils.fileSizeToBytes(0, 'MB')).to.eql(0);
      expect(utils.fileSizeToBytes(0, 'GB')).to.eql(0);

      expect(utils.fileSizeToBytes(123, 'KiB')).to.eql(123 * 1024);
      expect(utils.fileSizeToBytes(456, 'MiB')).to.eql(456 * 1024 * 1024);
      expect(utils.fileSizeToBytes(789, 'GiB')).to.eql(789 * 1024 * 1024 * 1024);
      expect(utils.fileSizeToBytes(12.3, 'KB')).to.eql(12300);
      expect(utils.fileSizeToBytes(45.6, 'MB')).to.eql(45600000);
      expect(utils.fileSizeToBytes(78.9, 'GB')).to.eql(78900000000);
    });
  });

  describe('sendOkResponse', function () {
    var fakeRes = {
      setHeader: sinon.stub(),
      send: sinon.stub(),
      end: sinon.stub()
    },
      nextStub = sinon.stub();

    beforeEach(function () {
      fakeRes.setHeader.reset();
      fakeRes.send.reset();
      fakeRes.end.reset();
      nextStub.reset();
    });

    it('should only set the minimum headers when invoked without further data', function () {
      utils.sendOkResponse(null, null, fakeRes, nextStub);

      expect(fakeRes.statusCode).to.eql(200);

      expect(fakeRes.setHeader.callCount).to.eql(1);
      expect(fakeRes.setHeader.calledWithExactly('Content-Type', 'application/json')).to.be.true;

      expect(fakeRes.send.callCount).to.eql(1);
      expect(fakeRes.send.calledWithExactly({
        code: 'Success',
        message: '',
        href: '<unknown>',
        data: {}
      })).to.be.true;

      expect(fakeRes.end.callCount).to.eql(1);

      expect(nextStub.callCount).to.eql(1);
    });

    it('should set all headers when invoked without more data', function () {
      var message = 'test message',
        data = {test: 'data'},
        url = 'test url',
        etag = 'test etag',
        lastModified = new Date();

      utils.sendOkResponse(message, data, fakeRes, nextStub, url, etag, lastModified);

      expect(fakeRes.statusCode).to.eql(200);

      expect(fakeRes.setHeader.callCount).to.eql(4);
      expect(fakeRes.setHeader.calledWithExactly('Content-Type', 'application/json')).to.be.true;
      expect(fakeRes.setHeader.calledWithExactly('Location', url)).to.be.true;
      expect(fakeRes.setHeader.calledWithExactly('ETag', etag)).to.be.true;
      expect(fakeRes.setHeader.calledWithExactly('Last-Modified',lastModified)).to.be.true;

      expect(fakeRes.send.callCount).to.eql(1);
      expect(fakeRes.send.calledWithExactly({
        code: 'Success',
        message: message,
        href: url,
        data: data
      })).to.be.true;

      expect(fakeRes.end.callCount).to.eql(1);

      expect(nextStub.callCount).to.eql(1);
    });
  });
});

