/*global app*/

(function (window) {
  'use strict';

  function Subscription(name, currentEpisode, searchParameters, lastDownloadTime, lastUpdateCheckTime) {
    this.name = name;
    this.currentEpisode = currentEpisode;
    this.searchParameters = searchParameters;
    this.lastDownloadTime = typeof lastDownloadTime == "string" ? new Date(lastDownloadTime) : lastDownloadTime;
    this.lastUpdateCheckTime = typeof lastUpdateCheckTime == "string" ? new Date(lastUpdateCheckTime) : lastUpdateCheckTime;
  }

  // export to window
  window.app = window.app || {};
  window.app.Subscription = Subscription;
}(window));
