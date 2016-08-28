'use strict';

var app = require('./src/app'),
    config = require('./src/common/config'),
    logger = require('./src/common/logger').log.child({component: 'server'});

app.listen(config.api.port, config.api.host, function () {
  logger.info('Started API on %s:%d', this.address().address, this.address().port);
});

