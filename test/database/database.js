'use strict';

/*
var subscriptions = require('./../test-subscriptions');

describe('database/database', function () {
  var minimalSubscription,
    extendedSubscription,
    allSubscriptions;

  beforeEach(function () {
    minimalSubscription = subscriptions.getMinimalSubscription();
    extendedSubscription = subscriptions.getExtendedSubscription();
    allSubscriptions = subscriptions.getAllSubscriptions();
  });

  it('should assign the expected default values', function () {
    expect(minimalSubscription.name).toBe('test minimal');
    expect(minimalSubscription.searchParameters).toBe('');
    expect(minimalSubscription.lastSeason).toBe(1);
    expect(minimalSubscription.lastEpisode).toBe(0);
    expect(typeof minimalSubscription.creationTime).toBe('object');
    expect(typeof minimalSubscription.lastModified).toBe('object');
    expect(minimalSubscription.lastSeasonUpdateCheck).toBeUndefined();
    expect(minimalSubscription.lastEpisodeUpdateCheck).toBeUndefined();

    expect(extendedSubscription.name).toBe('test extended');
    expect(extendedSubscription.searchParameters).toBe('a b c');
    expect(extendedSubscription.lastSeason).toBe(12);
    expect(extendedSubscription.lastEpisode).toBe(34);
    expect(typeof extendedSubscription.creationTime).toBe('object');
    expect(typeof extendedSubscription.lastModified).toBe('object');
    expect(extendedSubscription.lastSeasonUpdateCheck).toBeUndefined();
    expect(extendedSubscription.lastEpisodeUpdateCheck).toBeUndefined();
  });

  it('should return the expected returnable', function () {
    // the _id and __v field should be removed by getReturnable
    // (but everything else should be unchanged)
    allSubscriptions.forEach(function (sub) {
      var returnable,
        property;

      // (artificially) assign the database fields
      sub._id = 'foo';
      sub.__v = 123;

      // get returnable
      returnable = sub.getReturnable();

      // check whether the database fields have been removed
      expect(returnable._id).toBeUndefined();
      expect(returnable.__v).toBeUndefined();

      // iterate over the schema properties
      for (property in sub.schema.paths) {
        // skip the database fields...
        if (!sub.schema.paths.hasOwnProperty(property) ||
            property === '_id' || property === '__v') {
          continue;
        }

        // evaluate property value (handle Date differently due to the (de-)serialization)
        if (sub[property] && sub[property].getTime) {
          expect(new Date(returnable[property]).getTime()).toBe(sub[property].getTime());
        } else {
          expect(returnable[property]).toBe(sub[property]);
        }
      }
    });
  });

  it('should react correctly to updateLastEpisode calls with valid arguments', function () {
    // make valid episode updates
    expect(extendedSubscription.updateLastEpisode(12, 35)).toBe(true);
    expect(extendedSubscription.lastSeason).toBe(12);
    expect(extendedSubscription.lastEpisode).toBe(35);

    expect(extendedSubscription.updateLastEpisode(12, 36)).toBe(true);
    expect(extendedSubscription.lastSeason).toBe(12);
    expect(extendedSubscription.lastEpisode).toBe(36);

    // make valid season updates
    expect(extendedSubscription.updateLastEpisode(13, 1)).toBe(true);
    expect(extendedSubscription.lastSeason).toBe(13);
    expect(extendedSubscription.lastEpisode).toBe(1);

    expect(extendedSubscription.updateLastEpisode(14, 1)).toBe(true);
    expect(extendedSubscription.lastSeason).toBe(14);
    expect(extendedSubscription.lastEpisode).toBe(1);

    expect(extendedSubscription.updateLastEpisode('14', '2')).toBe(true);
    expect(extendedSubscription.lastSeason).toBe(14);
    expect(extendedSubscription.lastEpisode).toBe(2);
  });

  it('should react correctly to updateLastEpisode calls with invalid arguments', function () {
    // make invalid episode update attempts
    expect(extendedSubscription.updateLastEpisode(12, 33)).toBe(false);
    expect(extendedSubscription.updateLastEpisode(12, 34)).toBe(false);
    expect(extendedSubscription.updateLastEpisode(12, 36)).toBe(false);

    // make invalid season update attempts
    expect(extendedSubscription.updateLastEpisode(13, 34)).toBe(false);
    expect(extendedSubscription.updateLastEpisode(13, 35)).toBe(false);
    expect(extendedSubscription.updateLastEpisode(13, 0)).toBe(false);
    expect(extendedSubscription.updateLastEpisode(11, 1)).toBe(false);

    expect(extendedSubscription.updateLastEpisode(13)).toBe(false);
    expect(extendedSubscription.updateLastEpisode(undefined, 1)).toBe(false);
    expect(extendedSubscription.updateLastEpisode('asdf', 1)).toBe(false);
    expect(extendedSubscription.updateLastEpisode(13, 'foobar')).toBe(false);
  });
});
*/

