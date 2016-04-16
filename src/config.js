// host/port configuration of the server
exports.api = {
  host : 'localhost',
  port : 8000
};
exports.database = {
  host : 'localhost',
  port: 27017
};


// true if the server instance is running in a production environment
exports.productionEnvironment = false;


// command to use for starting torrents - don't start torrents in non-production environment
exports.torrentCommand = exports.productionEnvironment ? 'qbittorrent' : 'echo';


// stdout loglevel needn't be verbose in production (because we also write to logfile)
exports.stdoutLoglevel = exports.productionEnvironemtn ? 'warn' : 'debug';

exports.logDirectory = '/var/log/tv-show-downloader';

// write normal/error lot to file in production
exports.writeLogfile = exports.productionEnvironment;
exports.writeErrorlogfile = exports.productionEnvironment;

