
/*global app, confirm, mod*/

mod.controller('adminController', ['logger', 'settings', 'notification', 'adminHandler',
    function (logger, settings, notification, adminHandler) {
      'use strict';

      // continuous access to caller and some Important Objects
      var that = this,
          subscriptionSortTimer,
          serverHostTimer,
          serverPortTimer,
          maxTorrentsPerEpisodeTimer,
          torrentSortTimer;

      const SELECTION_SAVE_TIMEOUT = 1000,
            TEXT_SAVE_TIMEOUT = 2000;

      that.disks = [];
      that.version = {};

      that.subscriptionSort = settings.getSubscriptionSort();
      subscriptionSortTimer = null;
      that.onSubscriptionSortChanged = function () {
        clearTimeout(subscriptionSortTimer);
        subscriptionSortTimer = setTimeout(saveSubscriptionSort, SELECTION_SAVE_TIMEOUT);
      };
      function saveSubscriptionSort() {
        settings.setSubscriptionSort(that.subscriptionSort);
        notification.show('Saved new subscription sort `' + that.subscriptionSort + '`.');
      };

      that.serverHost = settings.getServerHost();
      serverHostTimer = null;
      that.onServerHostChanged = function () {
        clearTimeout(serverHostTimer);
        serverHostTimer = setTimeout(saveServerHost, TEXT_SAVE_TIMEOUT);
      };
      function saveServerHost() {
        settings.setServerHost(that.serverHost);
        notification.show('Saved new server host `' + that.serverHost + '`.');
      };

      that.serverPort = parseInt(settings.getServerPort(), 10);
      serverPortTimer = null;
      that.onServerPortChanged = function () {
        clearTimeout(serverPortTimer);
        serverPortTimer = setTimeout(saveServerPort, TEXT_SAVE_TIMEOUT);
      };
      function saveServerPort() {
        settings.setServerPort(that.serverPort);
        notification.show('Saved new server port `' + that.serverPort + '`.');
      };

      that.maxTorrentsPerEpisode = parseInt(settings.getMaxTorrentsPerEpisode(), 10);
      maxTorrentsPerEpisodeTimer = null;
      that.onMaxTorrentsPerEpisodeChanged = function () {
        clearTimeout(maxTorrentsPerEpisodeTimer);
        maxTorrentsPerEpisodeTimer = setTimeout(saveMaxTorrentsPerEpisode, TEXT_SAVE_TIMEOUT);
      };
      function saveMaxTorrentsPerEpisode() {
        settings.setMaxTorrentsPerEpisode(that.maxTorrentsPerEpisode);
        notification.show('Saved new max torrents per episode `' + that.maxTorrentsPerEpisode + '`.');
      };

      that.torrentSort = settings.getTorrentSort();
      torrentSortTimer = null;
      that.onTorrentSortChanged = function () {
        clearTimeout(torrentSortTimer);
        torrentSortTimer = setTimeout(saveTorrentSort, SELECTION_SAVE_TIMEOUT);
      };
      function saveTorrentSort() {
        settings.setTorrentSort(that.torrentSort);
        notification.show('Saved new torrent sort `' + that.torrentSort  + '`.');
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

      that.getVersion = function () {
        adminHandler.getVersion()
          .then(function (resp) {
            that.version = resp.data.data;
          })
          .catch(function (resp) {
            logger.logConsole('TODO: Handle response');
            logger.logConsole(resp);
          });
      };

      that.refresh = function () {
        that.getDiskUsage();
        that.getVersion();
      };

      that.refresh()
    }]);
