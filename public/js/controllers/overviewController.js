
/*global app, confirm, mod*/

mod.controller('overviewController', ['logger', 'subscriptionHandler',
    function (logger, subscriptionHandler) {
      'use strict';

      // continuous access to caller and some Important Objects
      var that = this;

      that.subscriptions = [];
      that.newEpisodes = {};

      that.getNumberOfDaysSinceDate = function (date) {
        return (new Date().getTime() - new Date(date).getTime()) / 1000 / 3600 / 24;
      };

      that.findSubscriptionUpdates = function (sub) {
        subscriptionHandler.findSubscriptionUpdates(sub)
          .then(function (resp) {
            resp.data.data.forEach(function (torrent) {
              if (!that.newEpisodes[sub.name])
                that.newEpisodes[sub.name] = [];
              that.newEpisodes[sub.name].push(torrent);
            });

            /*
            if (resp.data.data.length == 0)
              return;

            subscriptionHandler.getAllSubscriptions()
              .then(function (resp) {
                that.handleSubscriptionResponse(resp);
              });
              */
          })
          .catch(function (resp) {
            logger.logConsole('TODO: Handle response');
            logger.logConsole(resp);
          });
      };

      that.findAllSubscriptionUpdates = function () {
        Promise.all(that.subscriptions.map(function (sub) {
          return subscriptionHandler.findSubscriptionUpdates(sub)
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

      that.downloadEpisode = function (subscription, episodeInfo) {
        subscriptionHandler.downloadEpisode(subscription.name, episodeInfo.season, episodeInfo.episode, episodeInfo.link)
          .then(function (resp) {
            alert('TODO');
          })
        .catch(function (err) {
            alert('TODO');
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
