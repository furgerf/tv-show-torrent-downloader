
/*global app*/

(function (window) {
  'use strict';

  function AdminHandler($http, logger, settings) {
    settings = settings || {};
    settings.serverHost = settings.serverHost || 'http://localhost';
    settings.serverPort = settings.serverPort || '8000';

    var serverUrl = settings.serverHost + ':' + settings.serverPort + '/',
        diskUsageUrl = serverUrl + 'status/system/disk';

    this.getDiskUsage = function () {
      logger.logConsole('Retrieving disk usage information from ' + diskUsageUrl);
      return $http.get(diskUsageUrl);
    };
  };

  // Export to window
  window.app = window.app || {};
  window.app.AdminHandler = AdminHandler;
}(window));

