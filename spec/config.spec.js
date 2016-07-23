'use strict';

var config = require('../src/common/config');

describe('config - ensure that the expected config values are defined', function () {
  it('should contain the api address', function () {
    expect(config.api.host).toNotBe(undefined);
    expect(typeof config.api.port).toBe('number');
  });

  it('should contain the database address', function () {
    expect(config.database.host).toNotBe(undefined);
    expect(typeof config.database.port).toBe('number');
  });

  it('should contain the flag that denotes the environment', function () {
    expect(typeof config.productionEnvironment).toBe('boolean');
  });

  it('should contain the command to start torrents', function () {
    expect(typeof config.torrentCommand).toBe('string');
  });
});

