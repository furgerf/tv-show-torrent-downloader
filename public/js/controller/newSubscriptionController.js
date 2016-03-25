/*global app, confirm, mod*/

mod.controller('newSubscriptionController', ['logger', 'subscriptionHandler',
    function (logger, subscriptionHandler) {
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
            logger.logAlert(result.data.message);
            that.newShow.name = '';
            that.newShow.season = 0;
            that.newShow.episode = 0;
            that.newShow.searchParameters = '';
          });
      };

      console.log('newSubscriptionController created');
    }]);
