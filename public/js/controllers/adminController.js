
/*global app, confirm, mod*/

mod.controller('adminController', ['logger', 'settings', 'adminHandler',
    function (logger, settings, adminHandler) {
      'use strict';

      // continuous access to caller and some Important Objects
      var that = this;

      that.disks = [];

      that.subscriptionSort = settings.getSubscriptionSort();
      that.serverHost = settings.getServerHost();
      that.serverPort = parseInt(settings.getServerPort(), 10);
      that.torrentSort = settings.getTorrentSort();
      that.maxTorrentsPerEpisode = parseInt(settings.getMaxTorrentsPerEpisode(), 10);

      that.saveSubscriptionSort = function () {
        settings.setSubscriptionSort(that.subscriptionSort);
      };
      that.saveServerHost = function () {
        settings.setServerHost(that.serverHost);
      };
      that.saveServerPort = function () {
        settings.setServerPort(that.serverPort);
      };
      that.saveTorrentSort = function () {
        settings.setTorrentSort(that.torrentSort);
      };
      that.saveMaxTorrentsPerEpisode = function () {
        settings.setMaxTorrentsPerEpisode(that.maxTorrentsPerEpisode);
      };

      that.getDiskUsage = function () {
        adminHandler.getDiskUsage()
          .then(function (resp) {
            that.disks = resp.data.data;
            that.disks.forEach(function (disk) {
              disk.spaceAvailable = parseInt(disk.spaceAvailable, 10) * 1024;
              disk.spaceUsed = parseInt(disk.spaceUsed, 10) * 1024;
              disk.spaceTotal = disk.spaceAvailable + disk.spaceUsed;
              disk.freePercentage = Math.round(disk.spaceAvailable / disk.spaceTotal * 10000) / 100;
            });
          })
          .catch(function (resp) {
            logger.logConsole('TODO: Handle response');
            logger.logConsole(resp);
          });
      };

      that.refresh = function () {
        that.getDiskUsage();
      };

      that.refresh()
    }]);
