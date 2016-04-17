
/*global app, confirm, mod*/

mod.controller('adminController', ['logger', 'adminHandler',
    function (logger, adminHandler) {
      'use strict';

      // continuous access to caller and some Important Objects
      var that = this;

      that.disks = [];

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
