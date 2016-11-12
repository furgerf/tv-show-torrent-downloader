'use strict';

var parseArgs = require('minimist'),

  App = require('./src/app'),
  commonConfig = require('./src/common/config'),
  logger = require('./src/common/logger'),
  utils = require('./src/common/utils'),
  Subscription = require('./src/database/subscription'),

  // prepare argument parsing
  parseOptions = {
    string: [
      'api.host',
      'database.host',
      'torrentCommand'
    ],
    boolean: [ // specifying arguments as booleans makes them `false` if unspecified
      'production',
      'serveStaticFiles'
    ],
    alias: {
      h: 'help',
      apihost: 'api.host',
      apiport: 'api.port',
      databasehost: 'database.host',
      databaseport: 'database.port',
      torrentcommand: 'torrentCommand',
      servestaticfiles: 'serveStaticFiles'
    },
    unknown: function (arg) {
      console.log('WARNING: Unknown argument "' + arg + '", ignoring.');
      return false;
    }
  },
  removeAliases = function (args) {
    delete args._h;
    delete args.apihost;
    delete args.apiport;
    delete args.databasehost;
    delete args.databaseport;
    delete args.torrentcommand;
    delete args.servestaticfiles;

    return args;
  },
  removeNonConfigEntries = function (config) {
    delete config._;
    delete config.production;

    return config;
  },

  // parse arguments and prepare config
  args = removeAliases(parseArgs(process.argv.slice(2), parseOptions)),
  baseConfig = args.production ? commonConfig.getProductionConfig() : commonConfig.getDebugConfig(),
  config = removeNonConfigEntries(utils.mergeObjects(baseConfig, args)),

  log,
  app;

if (args.help) {
  console.log('Configurable values:');
  console.log('\t--production:\t\t\t\tTrue if the production default configuration should be used');
  console.log('\t--api.host, --apihost:\t\t\tHost where the API should be running');
  console.log('\t--api.port, --apiport:\t\t\tPort on which the API should be running');
  console.log('\t--database.host, --databasehost:\tHost of the database');
  console.log('\t--database.port, --databaseport:\tPort of the database');
  console.log('\t--torrentCommand, --torrentcommand:\tCommand that should be used to start a ' +
    'torrent download');
  console.log('\t--serveStaticFiles, --servestaticfiles:\tTrue if the server should also serve ' +
    'the static files for the web UI');
  process.exit();
}

log = logger.createLogger(config.logging).child({component: 'server'});
log.debug('Using configuration', config);

Subscription.initialize(log.child({component: 'database'}), config.database);

app = new App(config, log);

app.listen(function () {
  log.info('Started API on %s:%d', this.address().address, this.address().port);
});

