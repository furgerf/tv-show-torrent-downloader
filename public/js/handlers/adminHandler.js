
/*global app*/

(function (window) {
  'use strict';

  function AdminHandler($http, logger, settings) {
    var getDiskUsageUrl = function () {
        return settings.getServerAddress() + '/status/system/disk';
      },
      getVersionUrl = function () {
        return settings.getServerAddress() + '/status/version';
      };

    this.getDiskUsage = function () {
      var url = getDiskUsageUrl();
      logger.logConsole('Retrieving disk usage information from ' + url);
      return $http.get(url);
    };

    this.getVersion = function () {
      var url = getVersionUrl();
      logger.logConsole('Retrieving software version from ' + url);
      return $http.get(url);
    };
  };

  // Export to window
  window.app = window.app || {};
  window.app.AdminHandler = AdminHandler;
}(window));

