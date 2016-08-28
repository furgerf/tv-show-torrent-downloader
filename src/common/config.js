// true if the server instance is running in a production environment
exports.productionEnvironment = true;

// host/port configuration of the server

// always start the server locally
exports.api = {
  host : 'localhost',
  port : 8000
};

// use the raspi database if we actually want to do something
// NOTE that the torrents are still started locally though
exports.database = {
  host : exports.productionEnvironment ? 'localhost' : '192.168.1.31',
  port: 27017
};

// command to use for starting torrents - don't start torrents in non-production environment
exports.torrentCommand = exports.productionEnvironment ? 'qbittorrent' : 'echo';


exports.logDirectory = '/var/log/tv-show-torrent-downloader';

// stdout loglevel needn't be verbose in production (because we also write to logfile)
exports.stdoutLoglevel = exports.productionEnvironment ? 'warn' : 'debug';

// write normal/error lot to file in production
exports.writeLogfile = exports.productionEnvironment;
exports.writeErrorlogfile = exports.productionEnvironment;

