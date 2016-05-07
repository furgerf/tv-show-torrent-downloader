
/*global app*/

(function (window) {
  'use strict';

  function SubscriptionHandler($http, logger, settings) {
    var serverUrl = settings.getServerAddress(),
        subscriptionUrl = serverUrl + '/subscriptions',
        updateCheckUrl = serverUrl + '/subscriptions';

    this.getAllSubscriptions = function () {
      logger.logConsole('Retrieving all subscriptions from ' + subscriptionUrl);
      return $http.get(subscriptionUrl);
    };

    this.addSubscription = function (newSubscription) {
      var sub = {
        name: newSubscription.name,
        lastSeason: newSubscription.currentEpisode.season,
        lastEpisode: newSubscription.currentEpisode.episode,
        searchParameters: newSubscription.searchParameters
      },
      reqBody = JSON.stringify(sub);

      logger.logConsole('Adding subscription ' + reqBody + ' to ' + subscriptionUrl);

      return $http.post(subscriptionUrl, sub)
        .success(function (data, status, headers, config) {
          logger.logConsole("Successfully added subscription!");
        })
        .error(function (data, status, headers, config) {
          logger.logAlert("ERROR while adding subscription: " + JSON.stringify(data));
        });
    };

    this.updateSubscription = function (subscription) {
      logger.logConsole('Updating subscription ' + subscription.name + ' from ' + subscriptionUrl);
      return $http.get(subscriptionUrl + '/' + encodeURIComponent(subscription.name) + 'find/');
    };

    this.updateAllSubscriptions = function () {
      logger.logConsole('Updating all subscriptions from ' + updateCheckUrl);
      return $http.get(updateCheckUrl + '/find');
    };
  };

  // Export to window
  window.app = window.app || {};
  window.app.SubscriptionHandler = SubscriptionHandler;
}(window));

