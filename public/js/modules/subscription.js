/*global app*/

(function (window) {
  'use strict';

  function Subscription(name, currentEpisode, searchParameters, lastUpdatecheck) {
    this.name = name;
    this.currentEpisode = currentEpisode;
    this.searchParameters = searchParameters;
    this.lastUpdateCheck = lastUpdatecheck;
  }

  // export to window
  window.app = window.app || {};
  window.app.Subscription = Subscription;
}(window));
