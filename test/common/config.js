'use strict';

var expect = require('chai').expect,
  config = require('../../src/common/config');

describe('config', function () {
  describe('ensure that the expected config values are defined', function () {
    beforeEach(function () {
      this.debugConfig = config.getDebugConfig();
      this.productionConfig = config.getProductionConfig();
    });

    it('should have pre-defined debug and production configurations', function () {
      expect(config.getDebugConfig).to.be.a('function');
      expect(config.getProductionConfig).to.be.a('function');

      var debugConfig1 = config.getDebugConfig();
      var debugConfig2 = config.getDebugConfig();
      expect(debugConfig1).to.deep.equal(debugConfig2);

      var productionConfig1 = config.getProductionConfig();
      var productionConfig2 = config.getProductionConfig();
      expect(productionConfig1).to.deep.equal(productionConfig2);
    });

    it('should contain the api address', function () {
      expect(this.debugConfig.api.host).to.be.a('string');
      expect(this.debugConfig.api.port).to.be.a('number');

      expect(this.productionConfig.api.host).to.be.a('string');
      expect(this.productionConfig.api.port).to.be.a('number');
    });

    it('should contain the database address', function () {
      expect(this.debugConfig.database.host).to.be.a('string');
      expect(this.debugConfig.database.port).to.be.a('number');

      expect(this.productionConfig.database.host).to.be.a('string');
      expect(this.productionConfig.database.port).to.be.a('number');
    });

    it('should contain the command to start torrents', function () {
      expect(this.debugConfig.torrentCommand).to.be.a('string');

      expect(this.productionConfig.torrentCommand).to.be.a('string');
    });

    it('should contain the log configuration', function () {
      expect(this.debugConfig.logging.stdoutLoglevel).to.be.a('string');
      expect(this.debugConfig.logging.sourceLogging).to.be.a('boolean');
      expect(this.debugConfig.logging.logDirectory).to.be.a('string');
      expect(this.debugConfig.logging.writeLogfile).to.be.a('boolean');
      expect(this.debugConfig.logging.writeErrorlogfile).to.be.a('boolean');

      expect(this.productionConfig.logging.stdoutLoglevel).to.be.a('string');
      expect(this.productionConfig.logging.sourceLogging).to.be.a('boolean');
      expect(this.productionConfig.logging.logDirectory).to.be.a('string');
      expect(this.productionConfig.logging.writeLogfile).to.be.a('boolean');
      expect(this.productionConfig.logging.writeErrorlogfile).to.be.a('boolean');
    });

    it('should contain a flag that en/dis-ables serving static files', function () {
      expect(this.debugConfig.serveStaticFiles).to.be.a('boolean');

      expect(this.productionConfig.serveStaticFiles).to.be.a('boolean');
    });
  });
});

