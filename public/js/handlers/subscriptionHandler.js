
/*global app*/

(function (window) {
  'use strict';

  function SubscriptionHandler($http, logger, settings) {
    // URL helpers
    var getBaseSubscriptionUrl = function () {
          return settings.getServerAddress() + '/subscriptions';
        },
        getSubscriptionUrl = function (subscriptionName) {
          return getBaseSubscriptionUrl() + '/' + encodeURIComponent(subscriptionName);
        },
        getSubscriptionFindUpdateUrl = function (subscriptionName) {
          return getSubscriptionUrl(subscriptionName) + '/find';
        },
        getSubscriptionDownloadEpisodeUrl = function (subscriptionName) {
          return getSubscriptionUrl(subscriptionName) + '/update';
        };

    // public methods

    /**
     * Retrieves information about a subscription.
     * @param {String} subscriptionName - Name of the subscription to retrieve.
     * @returns {Promise} Promise of the HTTP request.
     */
    this.getSubscription = function (subscriptionName) {
      var url = getSubscriptionUrl(subscriptionName);

      logger.logConsole('Retrieving subscription info for "' + subscriptionName + '" with GET ' + url);
      return $http.get(url);
    };

    /**
     * Retrieves information about all subscriptions.
     * @returns {Promise} Promise of the HTTP request.
     */
    this.getAllSubscriptions = function () {
      var url = getBaseSubscriptionUrl();
      logger.logConsole('Retrieving all subscriptions with GET ' + url);
      return $http.get(url);
    };

    /**
     * Adds a new subscription.
     * @param {String} subscriptionName - Name of the subscription to retrieve.
     * @param {Object} newSubscription - Container for information about new subscription.
     * @param {String} newSubscription.name - Name of the new subscription.
     * @param {Object} newSubscription.currentEpisode - ShowEpisode object of the current episode.
     * @param {String} newSubscription.searchParameters - Optional search parameters for the subscription.
     * @returns {Promise} Promise of the HTTP request.
     */
    this.addSubscription = function (newSubscription) {
      var url = getBaseSubscriptionUrl(),
          sub = {
            name: newSubscription.name,
            lastSeason: newSubscription.currentEpisode.season,
            lastEpisode: newSubscription.currentEpisode.episode,
            searchParameters: newSubscription.searchParameters
          },
          reqBody = JSON.stringify(sub);

      logger.logConsole('Adding subscription ' + reqBody + ' to ' + url);
      return $http.post(url, sub);
    };

    /**
     * Finds updates for the subscription with the given name.
     * @returns {Promise} Promise of the HTTP request.
     */
    this.findSubscriptionUpdates = function (subscriptionName) {
      var url = getSubscriptionFindUpdateUrl(subscriptionName);
      logger.logConsole('Finding updates for subscription "' + subscriptionName + '" with GET ' + url);
      return $http.get(url);
    };

    /**
     * Tells the server to start download of a specific episode of a specific subscription.
     * @param {String} subscriptionName - Name of the subscription.
     * @param {Number} seasonNumber - Season number of the episode to download.
     * @param {Number} episodeNumber - Episode number of the episode to download..
     * @param {String} torrentLink - Link to the torrent to download.
     * @returns {Promise} Promise of the HTTP request.
     */
    this.downloadEpisode = function (subscriptionName, seasonNumber, episodeNumber, torrentLink) {
      var url = getSubscriptionDownloadEpisodeUrl(subscriptionName);
      logger.logConsole('Starting download of torrent ' + subscriptionName + ' ' + seasonNumber + '/' + episodeNumber + ' with PUT ' + url);
      return $http.put(url, { season: seasonNumber, episode: episodeNumber, link: torrentLink });
    };
  };

  // Export to window
  window.app = window.app || {};
  window.app.SubscriptionHandler = SubscriptionHandler;
}(window));

