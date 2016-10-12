'use strict';

var config = require('./src/common/config').getDebugConfig(),
  Subscription = require('./src/database/subscription'),
  logger = require('./src/common/logger'),
  log,
  App = require('./src/app'),
  app;

log = logger.createLogger(config.logging).child({component: 'server'});

Subscription.initialize(log.child({component: 'database'}), config.database);

app = new App(config, log);

app.listen(function () {
  log.info('Started API on %s:%d', this.address().address, this.address().port);
});

