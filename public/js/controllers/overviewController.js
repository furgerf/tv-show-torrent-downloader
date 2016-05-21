
/*global app, confirm, mod*/

mod.controller('overviewController', ['logger', 'subscriptionHandler',
    function (logger, subscriptionHandler) {
      'use strict';

      // continuous access to caller and some important objects
      var that = this;

      // list of subscription infos
      that.subscriptions = [];

      // map of subscription names to episode infos
      that.newEpisodes = {};

      /**
       * Gets the number of days that have passed since the specified date.
       * @param {Date} date - Reference date from which the days difference is calculated.
       * @returns {Number} The number of days since the specified date.
       */
      that.getNumberOfDaysSinceDate = function (date) {
        return (new Date().getTime() - new Date(date).getTime()) / 1000 / 3600 / 24;
      };

      // public methods

      /**
       * Retrieves updates for one subscription.
       * @param {String} subscriptionName - Name of the subscription for which to find updates.
       */
      that.findSubscriptionUpdates = function (subscriptionName) {
        subscriptionHandler.findSubscriptionUpdates(subscriptionName)
          .then(function (response) {
            handleSubscriptionUpdatesResponse(response, subscriptionName);

            // because the last update date changed, retrieve the subscription again
            getSubscription(subscriptionName);
          })
        .catch(function (resp) {
          logger.logAlert('Error ' + err.status + ' while requesting updates for subscription ' + subscriptionName + ':\n' + err.data.message);
        });
      };

      /**
       * Retrieves subscription updates for all subscriptions.
       */
      that.findAllSubscriptionUpdates = function () {
        logger.logConsole('Requesting updates for all subscriptions');
        that.subscriptions.forEach(function (sub) {
          that.findSubscriptionUpdates(sub.name);
        });
      };

      /**
       * Tells the server to start the download of a specific episode.
       * @param {String} subscriptionName - Name of the subscription to which the episode belongs.
       * @param {Object} episodeInfo - Container for information about the episode to download.
       * @param {Number} episodeInfo.season - Number of the season of the episode.
       * @param {Number} episodeInfo.episode - Number of the episode.
       * @param {String} episodeInfo.link - Link of the torrent to download.
       * @param {Boolean} [episodeInfo.isDownloade] - True if the episode had already been downloaded.
       */
      that.downloadEpisode = function (subscriptionName, episodeInfo) {
        if (episodeInfo.isDownloaded) {
          // we've already downloaded the episode so we're requesting a refresh instead
          // refresh means, we retrieve the subscription info again and check for updates
          getSubscription(subscriptionName)
            .then(function () {
              that.findSubscriptionUpdates(subscriptionName);
            });
          return;
        }

        // request download of episode
        subscriptionHandler.downloadEpisode(subscriptionName, episodeInfo.season, episodeInfo.episode, episodeInfo.link)
          .then(function (response) {
            if (response.status !== 200) {
              logger.logConsole('Unexpected episode download response code ' + response.status + '!\nMessage: ' + response.data.message);
              return;
            }

            logger.logConsole('Successfully started torrent download with message: ' + response.data.message);

            // when we get a successful response, we assume the download was started, so we update the properties
            // of all episodes that represent the same season/episode
            that.newEpisodes[subscriptionName].forEach(function (sub) {
              if (sub.episode == episodeInfo.episode && sub.season == episodeInfo.season) {
                sub.isDownloaded = true;
              }
            });
          })
        .catch(function (err) {
          logger.logAlert('Error ' + err.status + ' while requesting download of ' + subscriptionName + ', S' + $filter('filter')(episodeInfo.season, twoDigits) + 'E' + $filter('filter')(episodeInfo.episode, twoDigits) + ':\n' + err.data.message);
        });
      };


      // internal methods

      /**
       * Retrieves information about a single subscription.
       * @param {String} subscriptionName - Name of the subscription to retrieve.
       * @returns {Promise} Promise that is returned by the SubscriptionHandler.
       */
      function getSubscription (subscriptionName) {
        logger.logConsole('Retrieving info for subscription "' + subscriptionName + '".');

        return subscriptionHandler.getSubscription(subscriptionName)
          .then(function (resp) {
            handleSubscriptionResponse(resp);
          })
        .catch(function (err) {
          logger.logAlert('Error ' + err.status + ' while requesting infors for subscription ' + subscriptionName + ':\n' + err.data.message);
        });
      }

      /**
       * Processes the response that was received to a subscription update request,
       * updating the list of new episodes for the subscription.
       * @param {Object} response - Response as it was received from the server.
       * @param {String} subscriptionName - Name of the subscription to which the updates belong.
       */
      function handleSubscriptionUpdatesResponse (response, subscriptionName) {
          if (response.status !== 200) {
            logger.logConsole('Unexpected subscription update response code ' + response.status + '!\nMessage: ' + response.data.message);
            return;
          }

          logger.logConsole('Handling subscription update response for ' + subscriptionName + ' with message: ' + response.data.message);

          // remove all previously present new episodes for the subscription
          that.newEpisodes[subscriptionName] = [];
          // add the own new episodes for the subscription
          response.data.data.forEach(function (torrent) {
            that.newEpisodes[subscriptionName].push(torrent);
          });
      }

      /**
       * Processes the response that was received to a subscription info request,
       * adding it to the subscription list.
       * @param {Object} response - Response as it was received from the server.
       */
      function handleSubscriptionResponse (response) {
        if (response.status !== 200) {
          logger.logConsole('Unexpected subscription response code ' + response.status + '!\nMessage: ' + response.data.message);
          return;
        }

        var responseData = response.data.data;
        logger.logConsole('Handling subscription response with message: ' + response.data.message);

        // the response data is either an object with information about one subscription...
        if (responseData.name) {
          updateSubscriptionInfo(responseData);
          return;
        }

        // ... or an array with such objects
        // update list of subscription infos - process each new info separately
        // for each retrieved subscription info, remove all known infos from the current list
        // and add the new one
        responseData.forEach(updateSubscriptionInfo);
      }

      /**
       * Updates the subscription info of one subscription.
       * @param {Object} newSubscriptionInfo - Container for the new subscription information.
       * @param {String} newSubscriptionInfo.name - Name of the subscription.
       * @param {Number} newSubscriptionInfo.lastSeason - Current season number of the subscription.
       * @param {Number} newSubscriptionInfo.lastEpisode - Current episode number of the subscription.
       * @param {String} newSubscriptionInfo.searchParameters - Search parameters of the subscription.
       * @param {Date} newSubscriptionInfo.lastModified - Date when the subscription was last modified.
       */
      function updateSubscriptionInfo (newSubscriptionInfo) {
          that.subscriptions = that.subscriptions.filter(sub => sub.name != newSubscriptionInfo.name);
          that.subscriptions.push(new app.Subscription(newSubscriptionInfo.name, new app.ShowEpisode(newSubscriptionInfo.lastSeason, newSubscriptionInfo.lastEpisode), newSubscriptionInfo.searchParameters, newSubscriptionInfo.lastModified));
          that.subscriptions.sort(function (a, b) {
            return a.name > b.name;
          });
      }

      // initialization - retrieve all subscriptions
      subscriptionHandler.getAllSubscriptions()
        .then(function (resp) {
          handleSubscriptionResponse(resp);
        });
    }]);
