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

mod.service('subscriptions', ['$http', 'logger', 'settings',
    function ($http, logger, settings) {
      'use strict';
      return new app.Subscriptions($http, logger, settings);
    }]);

mod.filter('twoDigits', function () {
  return function(num) {
    var n = typeof num === 'number' ? num : parseInt(num, 10);
    return Number.isNaN(n) ? undefined : ('0' + n).slice(-2);
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
      /*
        .when('/ownposts', {
          templateUrl: 'html/own_posts.html',
          controller: 'ownPostsController as ownCtrl'
        })
        .when('/poststats', {
          templateUrl: 'html/post_stats.html',
          controller: 'postStatsController as psCtrl'
        })
        .when('/userstats', {
          templateUrl: 'html/user_stats.html',
          controller: 'userStatsController as usCtrl'
        })
        .when('/settings', {
          templateUrl: 'html/settings.html',
          controller: 'settingsController as setCtrl'
        })
        */
        .otherwise({
          redirectTo: '/overview'
        });
    }]);

