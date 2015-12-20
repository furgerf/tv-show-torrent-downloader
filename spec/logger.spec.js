'use strict';

var logger = require('../src/logger');

describe('logger - exports a logger', function () {
  it('should export an object that contains logging functions', function () {
    expect(typeof logger.log.debug).toBe('function');
    expect(typeof logger.log.info).toBe('function');
    expect(typeof logger.log.warn).toBe('function');
    expect(typeof logger.log.error).toBe('function');
  });
});
