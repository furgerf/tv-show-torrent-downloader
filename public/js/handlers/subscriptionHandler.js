
/*global app*/

(function (window) {
  'use strict';

  function SubscriptionHandler($http, logger, settings) {
    var getSubscriptionUrl = function () {
          return settings.getServerAddress() + '/subscriptions';
        },
        getUpdateCheckUrl = function () {
          return settings.getServerAddres() + '/subscriptions';
        };

    this.getAllSubscriptions = function () {
      var url = getSubscriptionUrl();
      logger.logConsole('Retrieving all subscriptions from ' + url);
      return $http.get(url);
    };

    this.addSubscription = function (newSubscription) {
      var url = getSubscriptionUrl(),
          sub = {
            name: newSubscription.name,
            lastSeason: newSubscription.currentEpisode.season,
            lastEpisode: newSubscription.currentEpisode.episode,
            searchParameters: newSubscription.searchParameters
          },
          reqBody = JSON.stringify(sub);

      logger.logConsole('Adding subscription ' + reqBody + ' to ' + url);

      return $http.post(url, sub)
        .success(function (data, status, headers, config) {
          logger.logConsole("Successfully added subscription!");
        })
        .error(function (data, status, headers, config) {
          logger.logAlert("ERROR while adding subscription: " + JSON.stringify(data));
        });
    };

    this.findSubscriptionUpdates = function (subscription) {
      var url = getSubscriptionUrl();
      logger.logConsole('Finding updates for subscription ' + subscription.name + ' from ' + url);
      return $http.get(url + '/' + encodeURIComponent(subscription.name) + '/find');
    };

    this.downloadEpisode = function (subscriptionName, seasonNumber, episodeNumber, torrentLink) {
      console.log(subscriptionName);
      console.log(seasonNumber);
      console.log(episodeNumber);
      console.log(torrentLink);
      alert('TODO');
      //var url = getSubscriptionUrl();
      //logger.logConsole('Finding updates for subscription ' + subscription.name + ' from ' + url);
      //return $http.get(url + '/' + encodeURIComponent(subscription.name) + '/find');
    };

    /*
    this.findAllSubscriptionUpdates = function () {
      var url = getSubscriptionUrl();
      logger.logConsole('Finding updates for all subscriptions from ' + url);
      return $http.get(url + '/find');
    };
    */
  };

  // Export to window
  window.app = window.app || {};
  window.app.SubscriptionHandler = SubscriptionHandler;
}(window));

