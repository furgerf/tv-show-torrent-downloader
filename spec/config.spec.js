'use strict';

var config = require('../src/config');

describe('config - ensure that the expected config values are defined', function () {
  it('should contain the api address', function () {
    expect(config.api.host).toNotBe(undefined);
    expect(typeof config.api.port).toBe('number');
  });

  it('should contain the database address', function () {
    expect(config.database.host).toNotBe(undefined);
    expect(typeof config.database.port).toBe('number');
  });

  it('should contain a function that returns a shift id', function () {
    // NOTE: we don't test the function itself as it may (and should!)
    // be modified for different mines
    expect(typeof config.getShiftId).toBe('function');
  });
});
