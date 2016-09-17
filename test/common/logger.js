'use strict';

var expect = require('chai').expect,
  logger = require('../../src/common/logger');

describe('logger', function () {
  describe('exports a logger factory function', function () {
    it('should export a function that contains logging functions', function () {
      expect(logger.createLogger).to.be.a('function');

      var log = logger.createLogger();

      expect(log.debug).to.be.a('function');
      expect(log.info).to.be.a('function');
      expect(log.warn).to.be.a('function');
      expect(log.error).to.be.a('function');
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

      expect(log.src).to.be.true;
      expect(log.streams).to.have.length(3);

      var [stdoutStream, fileStream, errorFileStream] = log.streams;

      expect(stdoutStream.level).to.equal(40); // 40 == 'warn'
      expect(stdoutStream.stream).to.equal(process.stdout);

      expect(fileStream.level).to.equal(30); // 30 == 'info'
      expect(fileStream.path).to.equal('/dev/null/tv-show-downloader.log');
      expect(fileStream.type).to.equal('rotating-file');

      expect(errorFileStream.level).to.equal(50); // 50 == 'error'
      expect(errorFileStream.path).to.equal('/dev/null/tv-show-downloader_error.log');
      expect(errorFileStream.type).to.equal('rotating-file');
    });
  });
});

