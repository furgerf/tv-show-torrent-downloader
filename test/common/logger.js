'use strict';

var should = require('chai').should(),
  logger = require('../../src/common/logger');

describe('logger - exports a logger factory function', function () {
  it('should export a function that contains logging functions', function () {
    logger.createLogger.should.be.a('function');

    var log = logger.createLogger();

    log.debug.should.be.a('function');
    log.info.should.be.a('function');
    log.warn.should.be.a('function');
    log.error.should.be.a('function');
  });

  it('should apply the provided log configuration', function () {
    var defaultLogger = logger.createLogger();

    var log = logger.createLogger(
      {
        stdoutLoglevel: 'warn',
        sourceLogging: !defaultLogger.src,
        logDirectory: '/dev/null',
        writeLogfile: true,
        writeErrorlogfile: true
      });

    log.src.should.be.true;
    log.streams.should.have.length(3);

    var [stdoutStream, fileStream, errorFileStream] = log.streams;

    stdoutStream.level.should.equal(40); // 40 == 'warn'
    stdoutStream.stream.should.equal(process.stdout);

    fileStream.level.should.equal(30); // 30 == 'info'
    fileStream.path.should.equal('/dev/null/tv-show-downloader.log');
    fileStream.type.should.equal('rotating-file');

    errorFileStream.level.should.equal(50); // 50 == 'error'
    errorFileStream.path.should.equal('/dev/null/tv-show-downloader_error.log');
    errorFileStream.type.should.equal('rotating-file');
  });
});

