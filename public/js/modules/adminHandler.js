
/*global app*/

(function (window) {
  'use strict';

  function AdminHandler($http, logger, settings) {
    var serverUrl = settings.getServerAddress(),
        diskUsageUrl = serverUrl + '/status/system/disk';

    this.getDiskUsage = function () {
      logger.logConsole('Retrieving disk usage information from ' + diskUsageUrl);
      return $http.get(diskUsageUrl);
    };
  };

  // Export to window
  window.app = window.app || {};
  window.app.AdminHandler = AdminHandler;
}(window));

