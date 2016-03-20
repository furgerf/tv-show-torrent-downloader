
/*global app*/

(function (window) {
  'use strict';

  function SubscriptionHandler($http, logger, settings) {
    settings = settings || {};
    settings.serverHost = settings.serverHost || 'http://localhost';
    settings.serverPort = settings.serverPort || '8000';

    var serverUrl = settings.serverHost + ':' + settings.serverPort + '/',
        subscriptionUrl = serverUrl + 'subscription/';

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

      $http.post(subscriptionUrl, sub)
        .success(function (data, status, headers, config) {
          logger.logConsole("Successfully added subscription!");
        })
        .error(function (data, status, headers, config) {
          logger.logAlert("ERROR while adding subscription: " + JSON.stringify(data));
        });
    };

    this.updateSubscription = function (subscription) {
      logger.logAlert('throw new notimplementedexception()');
      // (TODO: return promise)
  };

  // Export to window
  window.app = window.app || {};
  window.app.SubscriptionHandler = SubscriptionHandler;
}(window));
