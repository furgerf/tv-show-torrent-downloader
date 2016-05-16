
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
            that.newEpisodes[sub.name] = [];
            resp.data.data.forEach(function (torrent) {
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
              that.newEpisodes[sub.name] = [];
              resp.data.data.forEach(function (torrent) {
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
        if (episodeInfo.isDownloaded) {
          // we've already downloaded the episode so we're requesting a refresh instead
          // refresh means, we retrieve the subscription info again and check for updates
          that.getSubscription(subscription)
            .then(function () {
              that.findSubscriptionUpdates(subscription);
            });
          return;
        }

        // request download of episode
        subscriptionHandler.downloadEpisode(subscription.name, episodeInfo.season, episodeInfo.episode, episodeInfo.link)
          .then(function (resp) {
            that.newEpisodes[subscription.name].forEach(function (sub) {
              if (sub.episode == episodeInfo.episode && sub.season == episodeInfo.season) {
                sub.isDownloaded = true;
              }
            });
          })
        .catch(function (err) {
          logger.logAlert('Error ' + err.status + ' while requesting episode download:\n' + err.data.message);
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

      that.getSubscription = function (subscription) {
        return subscriptionHandler.getSubscription(subscription)
          .then(function (resp) {
            if (resp.status !== 200) {
              logger.logConsole('Unexpected response code ' + resp.status + '!');
              return;
            }

            logger.logConsole('Response message: ' + resp.data.message);
            that.subscriptions.forEach(function (sub, index) {
              if (sub.name != subscription.name)
                return; // "continue"

              that.subscriptions[index] = new app.Subscription(resp.data.data.name, new app.ShowEpisode(resp.data.data.lastSeason, resp.data.data.lastEpisode), resp.data.data.searchParameters, resp.data.data.lastModified);
              logger.logConsole('Replaced subscription!');
              return;
            });
          })
        .catch(function (err) {
          logger.logAlert('Error ' + err.status + ' while requesting subscription:\n' + err.data.message);
        });
      };

      subscriptionHandler.getAllSubscriptions()
        .then(function (resp) {
          that.handleSubscriptionResponse(resp);
        });
    }]);
