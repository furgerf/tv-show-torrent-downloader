/*global angular, app*/

var mod = angular.module('tv-show-downloader', ['ngRoute']);

// services
mod.service('logger', [
    function () {
      'use strict';
      return new app.Logger(0xFF);
    }]);
mod.service('utils', [
    function () {
      'use strict';
      return new app.Utils();
    }]);
mod.service('settings', ['utils', 'notification',
    function (utils, notification) {
      'use strict';
      return new app.Settings(utils, notification);
    }]);
mod.service('notification', [
    function () {
      'use strict';
      return new app.Notification();
    }]);

mod.service('subscriptionHandler', ['$http', 'logger', 'settings',
    function ($http, logger, settings) {
      'use strict';
      return new app.SubscriptionHandler($http, logger, settings);
    }]);
mod.service('adminHandler', ['$http', 'logger', 'settings',
    function ($http, logger, settings) {
      'use strict';
      return new app.AdminHandler($http, logger, settings);
    }]);

// filters
mod.filter('twoDigits', function () {
  return function(num) {
    var n = typeof num === 'number' ? num : parseInt(num, 10);
    return Number.isNaN(n) ? undefined : ('0' + n).slice(-2);
  };
});
mod.filter('dateTime', function (twoDigitsFilter) {
  return function(date) {
    if (!date)
      return 'Unknown';

    var dt = new Date(date),
      result =  dt.getDate() + '.' + (dt.getMonth() + 1) + '.' + dt.getFullYear();

    if (dt.getHours() && dt.getMinutes())
      result += ', ' + dt.getHours() + ':' + twoDigitsFilter(dt.getMinutes());

    return result
  };
});
mod.filter('searchParameters', function () {
  return function(parameters) {
    return 'Searching for "... SxxEyy ' + parameters + '"';
  };
});
mod.filter('fileSize', function () {
  return function(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
      fileSizeInBytes = fileSizeInBytes / 1024;
      i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
  };
});

// routing configuration
mod.config(['$routeProvider',
    function ($routeProvider) {
      'use strict';

      $routeProvider
        .when('/overview', {
          templateUrl: 'html/overview.html',
          controller: 'overviewController as overviewCtrl'
        })
        .when('/new', {
          templateUrl: 'html/newSubscription.html',
          controller: 'newSubscriptionController as newShowCtrl'
        })
        .when('/admin', {
          templateUrl: 'html/admin.html',
          controller: 'adminController as adminCtrl'
        })
        .otherwise({
          redirectTo: '/overview'
        });
    }]);

