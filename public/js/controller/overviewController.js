
/*global app, confirm, mod*/

mod.controller('overviewController', ['logger', 'subscriptionHandler',
    function (logger, subscriptionHandler) {
      'use strict';

      // continuous access to caller and some Important Objects
      var that = this;

      that.subscriptions = [];
      that.newEpisodes = {};

      that.updateSubscription = function (sub) {
        subscriptionHandler.updateSubscription(sub)
          .then(function (resp) {
            resp.data.data.forEach(function (torrent) {
              if (!that.newEpisodes[sub.name])
                that.newEpisodes[sub.name] = [];
              that.newEpisodes[sub.name].push(torrent);
            });


            if (resp.data.data.length == 0)
              return;

            subscriptionHandler.getAllSubscriptions()
              .then(function (resp) {
                that.handleSubscriptionResponse(resp);
              });
          })
          .catch(function (resp) {
            logger.logConsole('TODO: Handle response');
            logger.logConsole(resp);
          });
      };

      that.updateAllSubscriptions = function () {
        Promise.all(that.subscriptions.map(function (sub) {
          return subscriptionHandler.updateSubscription(sub)
            .then(function (resp) {
              resp.data.data.forEach(function (torrent) {
                if (!that.newEpisodes[sub.name])
                  that.newEpisodes[sub.name] = [];
                that.newEpisodes[sub.name].push(torrent);
              });
            });
        }))
        .then(function () {
          subscriptionHandler.getAllSubscriptions()
            .then(function (resp) {
              that.handleSubscriptionResponse(resp);
            });
        })
        .catch(function (resp) {
          logger.logConsole('TODO: Handle response');
          logger.logConsole(resp);
        });
      };

      that.handleSubscriptionResponse = function (resp) {
          if (resp.status !== 200) {
            logger.logConsole('Unexpected response code ' + resp.status + '!');
            return;
          }

          logger.logConsole('Response message: ' + resp.data.message);
          that.subscriptions = resp.data.data.map(function (data) {
            return new app.Subscription(data.name, new app.ShowEpisode(data.lastSeason, data.lastEpisode), data.searchParameters, data.lastModified);
          });
        };

      subscriptionHandler.getAllSubscriptions()
        .then(function (resp) {
          that.handleSubscriptionResponse(resp);
        });
    }]);
