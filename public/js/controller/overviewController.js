
/*global app, confirm, mod*/

mod.controller('overviewController', ['logger', 'subscriptionHandler',
    function (logger, subscriptionHandler) {
      'use strict';

      // continuous access to caller and some Important Objects
      var that = this;

      that.shows = [];

      subscriptionHandler.getAllSubscriptions()
        .then(function (resp) {
          if (resp.status !== 200) {
            logger.logConsole('Unexpected response code ' + resp.status + '!');
            return;
          }

          logger.logConsole('Response message: ' + resp.data.message);
          that.shows = resp.data.data.map(function (data) {
            return new app.Subscription(data.name, new app.ShowEpisode(data.lastSeason, data.lastEpisode), data.searchParameters, data.lastModified);
          });
        });
    }]);
