'use strict';

var should = require('chai').should(),
    config = require('../../src/common/config');

describe('config - ensure that the expected config values are defined', function () {
  beforeEach(function () {
    this.debugConfig = config.getDebugConfig();
    this.productionConfig = config.getProductionConfig();
  });

  it('should have pre-defined debug and production configurations', function () {
    config.getDebugConfig.should.be.a('function');
    config.getProductionConfig.should.be.a('function');

    var debugConfig1 = config.getDebugConfig();
    var debugConfig2 = config.getDebugConfig();
    debugConfig1.should.deep.equal(debugConfig2);

    var productionConfig1 = config.getProductionConfig();
    var productionConfig2 = config.getProductionConfig();
    productionConfig1.should.deep.equal(productionConfig2);
  });

  it('should contain the api address', function () {
    this.debugConfig.api.host.should.be.a('string');
    this.debugConfig.api.port.should.be.a('number');

    this.productionConfig.api.host.should.be.a('string');
    this.productionConfig.api.port.should.be.a('number');
  });

  it('should contain the database address', function () {
    this.debugConfig.database.host.should.be.a('string');
    this.debugConfig.database.port.should.be.a('number');

    this.productionConfig.database.host.should.be.a('string');
    this.productionConfig.database.port.should.be.a('number');
  });

  it('should contain the command to start torrents', function () {
    this.debugConfig.torrentCommand.should.be.a('string');

    this.productionConfig.torrentCommand.should.be.a('string');
  });

  it('should contain the log configuration', function () {
    this.debugConfig.logging.stdoutLoglevel.should.be.a('string');
    this.debugConfig.logging.sourceLogging.should.be.a('boolean');
    this.debugConfig.logging.logDirectory.should.be.a('string');
    this.debugConfig.logging.writeLogfile.should.be.a('boolean');
    this.debugConfig.logging.writeErrorlogfile.should.be.a('boolean');

    this.productionConfig.logging.stdoutLoglevel.should.be.a('string');
    this.productionConfig.logging.sourceLogging.should.be.a('boolean');
    this.productionConfig.logging.logDirectory.should.be.a('string');
    this.productionConfig.logging.writeLogfile.should.be.a('boolean');
    this.productionConfig.logging.writeErrorlogfile.should.be.a('boolean');
  });

  it('should contain a flag that en/dis-ables serving static files', function () {
    this.debugConfig.serveStaticFiles.should.be.a('boolean');

    this.productionConfig.serveStaticFiles.should.be.a('boolean');
  });
});

