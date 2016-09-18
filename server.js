'use strict';

var config = require('./src/common/config').getDebugConfig(),
  database = require('./src/database/database'),
  logger = require('./src/common/logger'),
  log,
  App = require('./src/app').App,
  app;

log = logger.createLogger(config.logging).child({component: 'server'});

app = new App(config, log);

database.connect(config.database, log.child({component: 'database'}));

app.listen(function () {
  log.info('Started API on %s:%d', this.address().address, this.address().port);
});

