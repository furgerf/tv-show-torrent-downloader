'use strict';

var rewire = require('rewire'),
  utils = rewire('../src/utils');

describe('utils - twoDigitNumber', function () {
  var twoDigitNumber = utils.__get__('twoDigitNumber');

  it('should return two digits when invoked with (parsable) numbers', function () {
    expect(twoDigitNumber(0)).toBe('00');
    expect(twoDigitNumber(1)).toBe('01');
    expect(twoDigitNumber(-1)).toBe('-1');
    expect(twoDigitNumber(12)).toBe('12');
    expect(twoDigitNumber(-12)).toBe('12'); // hmm...
    expect(twoDigitNumber(123)).toBe('23');
    expect(twoDigitNumber(-123)).toBe('23'); // hmm...
    expect(twoDigitNumber('123')).toBe('23');
  });

  it('should return undefined if invoked without a number', function () {
    expect(twoDigitNumber(null)).toBeUndefined();
    expect(twoDigitNumber(undefined)).toBeUndefined();
    expect(twoDigitNumber('abc')).toBeUndefined();
    expect(twoDigitNumber('a')).toBeUndefined();
    expect(twoDigitNumber('')).toBeUndefined();
  });
});

describe('utils - formatEpisodeNumber', function () {
  it('should return the correct string if invoked with valid arguments', function () {
    expect(utils.formatEpisodeNumber(0, 0)).toBe('S00E00');
    expect(utils.formatEpisodeNumber(0, 5)).toBe('S00E05');
    expect(utils.formatEpisodeNumber(5, 0)).toBe('S05E00');
    expect(utils.formatEpisodeNumber(-2, 0)).toBe('S-2E00');
    expect(utils.formatEpisodeNumber(0, -2)).toBe('S00E-2');
    expect(utils.formatEpisodeNumber(-2, 5)).toBe('S-2E05');
    expect(utils.formatEpisodeNumber(12, 34)).toBe('S12E34');
  });

  it('should return undefined if invoked with invalid arguments', function () {
    expect(utils.formatEpisodeNumber(0)).toBeUndefined();
    expect(utils.formatEpisodeNumber(null, 0)).toBeUndefined();
    expect(utils.formatEpisodeNumber(undefined, 0)).toBeUndefined();
    expect(utils.formatEpisodeNumber(null, null)).toBeUndefined();
    expect(utils.formatEpisodeNumber(12, 'ab')).toBeUndefined();
    expect(utils.formatEpisodeNumber('', 34)).toBeUndefined();
  });
});

describe('utils - fileSizeToBytes', function () {
  it('should return the file size if invoked with valid arguments', function () {
    expect(utils.fileSizeToBytes(0, 'KiB')).toBe(0);
    expect(utils.fileSizeToBytes(0, 'MiB')).toBe(0);
    expect(utils.fileSizeToBytes(0, 'GiB')).toBe(0);
    expect(utils.fileSizeToBytes(0, 'KB')).toBe(0);
    expect(utils.fileSizeToBytes(0, 'MB')).toBe(0);
    expect(utils.fileSizeToBytes(0, 'GB')).toBe(0);

    expect(utils.fileSizeToBytes(123, 'KiB')).toBe(123 * 1024);
    expect(utils.fileSizeToBytes(456, 'MiB')).toBe(456 * 1024 * 1024);
    expect(utils.fileSizeToBytes(789, 'GiB')).toBe(789 * 1024 * 1024 * 1024);
    expect(utils.fileSizeToBytes(12.3, 'KB')).toBe(12300);
    expect(utils.fileSizeToBytes(45.6, 'MB')).toBe(45600000);
    expect(utils.fileSizeToBytes(78.9, 'GB')).toBe(78900000000);
  });

  it('should return undefined if the number argument is invalid', function () {
    expect(utils.fileSizeToBytes(null, 'KiB')).toBe(undefined);
    expect(utils.fileSizeToBytes(undefined, 'MiB')).toBe(undefined);
    expect(utils.fileSizeToBytes('', 'GiB')).toBe(undefined);
    expect(utils.fileSizeToBytes('a', 'KB')).toBe(undefined);
  });

  it('should return undefined if the unit argument is invalid', function () {
    expect(utils.fileSizeToBytes(12, 'TiB')).toBe(undefined);
    expect(utils.fileSizeToBytes(34, 'TB')).toBe(undefined);
    expect(utils.fileSizeToBytes(56, 'abc')).toBe(undefined);
    expect(utils.fileSizeToBytes(78, '')).toBe(undefined);
    expect(utils.fileSizeToBytes(90, null)).toBe(undefined);
  });
});

describe('utils - sendOkResponse', function () {
  it('should only set the minimum headers when invoked without further data', function () {
    var header = {},
      data,
      endCalls = 0,
      response = {
        statusCode: null,
        setHeader: function (key, value) { header[key] = value; },
        send: function (responseData) { data = responseData; },
        end: function () { endCalls++; }
      };

    utils.sendOkResponse(response);

    expect(response.statusCode).toBe(200);
    expect(header['Content-Type']).toBe('application/json');

    expect(Object.keys(data).length).toBe(4);
    expect(data.code).toBe('Success');
    expect(data.message).toBe('');
    expect(data.href).toBe('<unknown>');
    expect(Object.keys(data.data).length).toBe(0);

    expect(endCalls).toBe(1);
  });
});

