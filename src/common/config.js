'use strict';

function Config(api, database, torrentCommand, logging, serveStaticFiles) {
  this.api = api;
  this.database = database;
  this.torrentCommand = torrentCommand;
  this.logging = logging;
  this.serveStaticFiles = serveStaticFiles;
}

function getDebugConfig() {
  return new Config(
    {
      host : 'localhost',
      port : 8000
    },
    {
      host : 'localhost',
      port: 27017
    },
    'echo',
    {
      stdoutLoglevel: 'debug',
      sourceLogging: true,
      logDirectory: '/dev/null',
      writeLogfile: false,
      writeErrorlogfile: false
    },
    true);
}

function getProductionConfig() {
  return new Config(
    {
      host : 'localhost',
      port : 8000
    },
    {
      host : 'localhost',
      port: 27017
    },
    'qbittorrent',
    {
      stdoutLoglevel: 'warn',
      sourceLogging: false,
      logDirectory: '/var/log/tv-show-torrent-downloader',
      writeLogfile: true,
      writeErrorlogfile: true
    },
    false);
}

// access debug/dev configuration
exports.getDebugConfig = getDebugConfig;

// access production configuration
exports.getProductionConfig = getProductionConfig;

