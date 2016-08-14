/*global app, confirm, mod*/

mod.controller('newSubscriptionController', ['logger', 'subscriptionHandler', 'notification',
    function (logger, subscriptionHandler, notification) {
      'use strict';

      // continuous access to caller and some Important Objects
      var that = this;
      that.newShow = {
        name: '',
        season: 0,
        episode: 0,
        searchParameters: ''
      };

      that.addShow = function () {
        if (!that.newShow.name)
          return;

        var newSubscription = new app.Subscription(that.newShow.name, new app.ShowEpisode(that.newShow.season, that.newShow.episode), that.newShow.searchParameters);

        console.log('Creating new show with data: ' + JSON.stringify(newSubscription));
        subscriptionHandler.addSubscription(newSubscription)
          .then (function (result) {
            that.newShow.name = '';
            that.newShow.season = 0;
            that.newShow.episode = 0;
            that.newShow.searchParameters = '';
            notification.show('Created new show `' + newSubscription.name + '`');
          });
      };

      console.log('newSubscriptionController created');
    }]);
