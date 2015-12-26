'use strict';

var rewire = require('rewire'),
    utils = rewire('../src/utils');

describe('utils - twoDigitNumber', function () {
  var twoDigitNumber = utils.__get__('twoDigitNumber');

  it('should always return two digits when invoked with numbers', function () {
    expect(twoDigitNumber(0)).toBe('00');
    expect(twoDigitNumber(1)).toBe('01');
    expect(twoDigitNumber(-1)).toBe('-1');
    expect(twoDigitNumber(12)).toBe('12');
    expect(twoDigitNumber(-12)).toBe('12'); // hmm...
    expect(twoDigitNumber(123)).toBe('23');
    expect(twoDigitNumber(-123)).toBe('23'); // hmm...
  });

  it('should always return two digits when invoked with numbers', function () {
    expect(twoDigitNumber(null)).toBe('00');
    expect(twoDigitNumber(undefined)).toBe('00');
    expect(twoDigitNumber('123')).toBe('23');
    expect(twoDigitNumber('abc')).toBe('bc'); // hmm...
    expect(twoDigitNumber('a')).toBe('0a'); // hmm...
    expect(twoDigitNumber('')).toBe('00');
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

