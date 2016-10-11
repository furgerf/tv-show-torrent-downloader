'use strict';

var expect = require('chai').expect,
  rewire = require('rewire'),
  sinon = require('sinon'),
  logger = rewire('../../src/common/logger');

describe('logger', function () {
  describe('exports a logger factory function', function () {
    // create and inject fake FS module
    var fakeFs = {
      existsSync: sinon.stub(),
      mkdirSync: sinon.stub()
    };
    fakeFs.existsSync.returns(true);
    logger.__set__('fs', fakeFs);

    beforeEach(function () {
      fakeFs.existsSync.reset();
      fakeFs.mkdirSync.reset();
    });

    it('should export a function that contains logging functions', function () {
      expect(logger.createLogger).to.be.a('function');

      var log = logger.createLogger();

      expect(log.debug).to.be.a('function');
      expect(log.info).to.be.a('function');
      expect(log.warn).to.be.a('function');
      expect(log.error).to.be.a('function');
    });

    it('should apply the provided log configuration, writing to both logfiles', function () {
      var defaultLogger = logger.createLogger(),
        log = logger.createLogger(
          {
            stdoutLoglevel: 'warn',
            sourceLogging: !defaultLogger.src,
            logDirectory: '/dev/null',
            writeLogfile: true,
            writeErrorlogfile: true
          }),
        stdoutStream, fileStream, errorFileStream;

      expect(log.src).to.be.true;
      expect(log.streams).to.have.length(3);

      [stdoutStream, fileStream, errorFileStream] = log.streams;

      expect(stdoutStream.level).to.equal(40); // 40 == 'warn'
      expect(stdoutStream.stream).to.equal(process.stdout);

      expect(fileStream.level).to.equal(30); // 30 == 'info'
      expect(fileStream.path).to.equal('/dev/null/tv-show-downloader.log');
      expect(fileStream.type).to.equal('rotating-file');

      expect(errorFileStream.level).to.equal(50); // 50 == 'error'
      expect(errorFileStream.path).to.equal('/dev/null/tv-show-downloader_error.log');
      expect(errorFileStream.type).to.equal('rotating-file');

      expect(fakeFs.existsSync.calledTwice).to.be.true;
      expect(fakeFs.mkdirSync.notCalled).to.be.true;
    });

    it('should apply the provided log configuration, writing to no logfile', function () {
      var defaultLogger = logger.createLogger(),
        log = logger.createLogger(
          {
            stdoutLoglevel: 'warn',
            sourceLogging: !defaultLogger.src,
            logDirectory: '/dev/null',
            writeLogfile: false,
            writeErrorlogfile: false
          }),
        stdoutStream;

      expect(log.src).to.be.true;
      expect(log.streams).to.have.length(1);

      stdoutStream = log.streams[0];

      expect(stdoutStream.level).to.equal(40); // 40 == 'warn'
      expect(stdoutStream.stream).to.equal(process.stdout);

      expect(fakeFs.existsSync.notCalled).to.be.true;
      expect(fakeFs.mkdirSync.notCalled).to.be.true;
    });

    it('should apply the provided log configuration, writing to the main logfile', function () {
      fakeFs.existsSync.returns(false);

      var defaultLogger = logger.createLogger(),
        logOptions = {
            stdoutLoglevel: 'warn',
            sourceLogging: !defaultLogger.src,
            logDirectory: '/dev/null',
            writeLogfile: true,
            writeErrorlogfile: false
          },
        log = logger.createLogger(logOptions),
        stdoutStream, fileStream;

      expect(log.src).to.be.true;
      expect(log.streams).to.have.length(2);

      [stdoutStream, fileStream] = log.streams;

      expect(stdoutStream.level).to.equal(40); // 40 == 'warn'
      expect(stdoutStream.stream).to.equal(process.stdout);

      expect(fileStream.level).to.equal(30); // 30 == 'info'
      expect(fileStream.path).to.equal('/dev/null/tv-show-downloader.log');
      expect(fileStream.type).to.equal('rotating-file');

      expect(fakeFs.existsSync.calledOnce).to.be.true;
      expect(fakeFs.mkdirSync.calledOnce).to.be.true;
      expect(fakeFs.mkdirSync.calledWithExactly(logOptions.logDirectory)).to.be.true;
    });

    it('should apply the provided log configuration, writing to the error logfile', function () {
      fakeFs.existsSync.returns(false);

      var defaultLogger = logger.createLogger(),
        logOptions = {
            stdoutLoglevel: 'warn',
            sourceLogging: !defaultLogger.src,
            logDirectory: '/dev/null',
            writeLogfile: false,
            writeErrorlogfile: true
          },
        log = logger.createLogger(logOptions),
        stdoutStream, errorFileStream;

      expect(log.src).to.be.true;
      expect(log.streams).to.have.length(2);

      [stdoutStream, errorFileStream] = log.streams;

      expect(stdoutStream.level).to.equal(40); // 40 == 'warn'
      expect(stdoutStream.stream).to.equal(process.stdout);

      expect(errorFileStream.level).to.equal(50); // 50 == 'error'
      expect(errorFileStream.path).to.equal('/dev/null/tv-show-downloader_error.log');
      expect(errorFileStream.type).to.equal('rotating-file');

      expect(fakeFs.existsSync.calledOnce).to.be.true;
      expect(fakeFs.mkdirSync.calledOnce).to.be.true;
      expect(fakeFs.mkdirSync.calledWithExactly(logOptions.logDirectory)).to.be.true;
    });
  });
});

