/*global app*/

(function (window) {
  'use strict';

  function ShowEpisode(season, episode) {
    this.season = typeof season == "string" ? parseInt(season, 10) : season;
    this.episode = typeof episode == "string" ? parseInt(episode, 10) : episode;
  }

  // export to window
  window.app = window.app || {};
  window.app.ShowEpisode = ShowEpisode;
}(window));
