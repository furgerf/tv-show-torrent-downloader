/*global angular, app*/

var mod = angular.module('tv-show-downloader', ['ngRoute']);

// services
mod.service('logger', [
    function () {
      // logger singleton instance
      'use strict';
      return new app.Logger(0xFF);
    }]);

mod.value('settings', {
  serverHost: "http://localhost",
  serverPort: 8000
});

mod.service('subscriptionHandler', ['$http', 'logger', 'settings',
    function ($http, logger, settings) {
      'use strict';
      return new app.SubscriptionHandler($http, logger, settings);
    }]);

mod.filter('twoDigits', function () {
  return function(num) {
    var n = typeof num === 'number' ? num : parseInt(num, 10);
    return Number.isNaN(n) ? undefined : ('0' + n).slice(-2);
  };
});

mod.filter('dateTime', function () {
  return function(date) {
    dt = new Date(date);
    return dt.getDate() + '.' + (dt.getMonth() + 1) + '.' + dt.getFullYear()
      + ', ' + dt.getHours() + ':' + dt.getMinutes();
  };
});

mod.filter('searchParameters', function () {
  return function(parameters) {
    return 'Searching for "... SxxEyy ' + parameters + '"';
  };
});

/*
mod.service('currentUser', [

function () {
// current user singleton instance
'use strict';

return new app.User();
}]);
*/

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
        .otherwise({
          redirectTo: '/overview'
        });
    }]);

