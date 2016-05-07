
/*global app, confirm, mod*/

mod.controller('adminController', ['logger', 'settings', 'adminHandler',
    function (logger, settings, adminHandler) {
      'use strict';

      // continuous access to caller and some Important Objects
      var that = this;

      that.disks = [];

      that.serverHost = settings.getServerHost();
      that.serverPort = parseInt(settings.getServerPort(), 10);

      that.saveServerHost = function () {
        settings.setServerHost(that.serverHost);
      };
      that.saveServerPort = function () {
        settings.setServerPort(that.serverPort);
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
