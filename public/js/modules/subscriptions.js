
/*global app*/

(function (window) {
  'use strict';

  function Subscriptions($http, logger, settings) {
    settings = settings || {};
    settings.serverHost = settings.serverHost || 'http://localhost';
    settings.serverPort = settings.serverPort || '8000';

    var serverUrl = settings.serverHost + ':' + settings.serverPort + '/';

    this.getAllSubscriptions = function () {
      logger.logConsole("Retrieving all subscriptions");

      var url = serverUrl + "subscription";

      logger.logConsole(url);

      return $http.get(url);
    };

    this.addUser = function (user) {
      logger.logConsole("Adding user " + user);

      // set db-specific property
      user.type = "user";

      // try to put data to db
      addJob(function () {
        logger.logConsole("JOB: addUser");
        $http.put(getDbUrl() + user.getId(), user, getConfig())
          .success(function (data, status, headers, config) {
            logger.logConsole("Successfully added user!");
          })
        .error(function (data, status, headers, config) {
          logger.logAlert("ERROR while running addUser:");
          logger.logAlert(data);
        });
      });
    };
  };

  // Export to window
  window.app = window.app || {};
  window.app.Subscriptions = Subscriptions;
}(window));
