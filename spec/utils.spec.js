'use strict';

var utils = require('../src/utils');

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
    expect(Object.keys(data).length).toBe(0);
    expect(endCalls).toBe(1);
  });
});
