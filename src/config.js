exports.api = {
  host : 'localhost',
  port : 8000
};

exports.database = {
  host : 'localhost',
  port: 27017
};

exports.productionEnvironment = false;

exports.torrentCommand = exports.productionEnvironment ? 'qbittorrent' : 'echo';

