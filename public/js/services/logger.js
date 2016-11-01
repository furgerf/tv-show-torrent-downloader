/*global console, alert*/
/*jslint bitwise: true*/

(function (window) {
  'use strict';

  function Logger(logToConsole, logToAlert, logToFile) {
    // assign logMethods as if three boolean parameters were used
    var logMethods =
      (typeof logToConsole === 'boolean' && logToConsole === true ? 0x1 : 0x0) +
      (typeof logToAlert === 'boolean' && logToAlert === true ? 0x2 : 0x0) +
      (typeof logToFile === 'boolean' && logToFile === true ? 0x4 : 0x0);

    // override logMethods if number was used instead
    if (typeof logToConsole === 'number' && logToAlert === undefined && logToFile === undefined) {
      logMethods = logToConsole;
    }

    // methods to actually log messages
    // higher priority messages call lower priority methods
    this.logConsole = function (msg) {
      if (logMethods & 0x1) {
        console.log(msg);
      }
    };
    this.logAlert = function (msg) {
      if (logMethods & 0x2) {
        alert(msg);
      }
      this.logConsole("ALERT: " + msg);
    };
    this.logFile = function (msg) {
      if (logMethods & 0x4) {
        alert("LOGGING TO FILE IS NOT IMPLEMENTED!");
      }
      this.logAlert(msg);
    };

    //update log method
    this.setLogMethod = function (logToConsole, logToAlert, logToFile) {
      if (typeof logToConsole === 'boolean' && typeof logToAlert === 'boolean' && typeof logToFile === 'boolean') {
        // assign logMethods as if three boolean parameters were used
        logMethods =
          (logToConsole === true ? 0x1 : 0x0) +
          (logToAlert === true ? 0x2 : 0x0) +
          (logToFile === true ? 0x4 : 0x0);

        return true;
      }

      if (typeof logToConsole === 'number' && logToAlert === undefined && logToFile === undefined) {
        // assign logMethods if number was used instead
        logMethods = logToConsole;
        return true;
      }

      return false;
    };

    // turn specific logging methods on/off
    this.setLoggingToConsole = function (setEnabled) {
      if (((logMethods & 0x1) === 0) === setEnabled) {
        logMethods ^= 0x1;
      }
    };
    this.setLoggingToAlert = function (setEnabled) {
      if (((logMethods & 0x2) === 0) === setEnabled) {
        logMethods ^= 0x2;
      }
    };
    this.setLoggingToFile = function (setEnabled) {
      if (((logMethods & 0x4) === 0) === setEnabled) {
        logMethods ^= 0x4;
      }
    };
  }

  // Export to window
  window.app = window.app || {};
  window.app.Logger = Logger;
}(window));
