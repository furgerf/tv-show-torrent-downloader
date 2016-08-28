'use strict';

var should = require('chai').should(),
    config = require('../src/common/config');

describe('config - ensure that the expected config values are defined', function () {
  it('should contain the api address', function () {
    config.api.host.should.be.a('string');
    config.api.port.should.be.a('number');
  });

  it('should contain the database address', function () {
    config.database.host.should.be.a('string');
    config.database.port.should.be.a('number');
  });

  it('should contain the flag that denotes the environment', function () {
    config.productionEnvironment.should.be.a('boolean');
  });

  it('should contain the command to start torrents', function () {
    config.torrentCommand.should.be.a('string');
  });

  it('should contain the log configuration', function () {
    config.logDirectory.should.be.a('string');

    config.stdoutLoglevel.should.be.a('string');

    config.writeLogfile.should.be.a('boolean');
    config.writeErrorlogfile.should.be.a('boolean');
  });
});

