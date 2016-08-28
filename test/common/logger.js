'use strict';

var should = require('chai').should(),
    logger = require('../../src/common/logger');

describe('logger - exports a logger', function () {
  it('should export an object that contains logging functions', function () {
    logger.log.should.exist;
    logger.log.debug.should.be.a('function');
    logger.log.debug.should.be.a('function');
    logger.log.info.should.be.a('function');
    logger.log.warn.should.be.a('function');
    logger.log.error.should.be.a('function');
  });
});

