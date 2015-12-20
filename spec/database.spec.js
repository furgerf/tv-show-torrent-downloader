'use strict';

var rewire = require('rewire'),
    database = rewire('../src/database'),
    mongoClientMock = {
      connectedTo: [],
      connect: function (address) {
        this.connectedTo.push(address);
      }
    },
    fatigueDatabaseMock = (function () {
      queries: [],
      collection: function (name) {
        return {
          s: {
            dbName: 'fatigue',
            name: 'dunno lolz'
          },
          findOne: function (query, projection, options) {
            console.log("BAAAAAAAAAR");
            that.queries.push(name + '.findOne(' + query + ', ' + projection + ', ' + options + ')');

            return true;
            //return new Promise(function (resolve, reject) { resolve(); });
          }
        }
      }
    })();

beforeEach(function () {
  fatigueDatabaseMock.queries = [];
  database.__set__({
    isClientConnected: true,
    fatigueDatabase: fatigueDatabaseMock
  });
});

describe('database - constant fields', function () {
  it('should have valid constant fields', function () {
    expect(typeof database.__get__('databaseUrl')).toBe('string');

    expect(database.__get__('fatigueDatabaseName')).toBe('fatigue');
    expect(typeof database.__get__('fatigueDatabaseAddress')).toBe('string');
  });
});

describe('database - collection names', function () {
  it('should be using the correct collection names', function () {
    expect(database.operatorCollection).toBe('operators');
    expect(database.signalCollection).toBe('signals');
    expect(database.scheduleCollection).toBe('schedules');
  });
});

describe('database - mongodb connection', function () {
  it('should attempt to establish a mongodb connection if none is present', function () {
    // inject mongoClient mock
    var revertMongoClientMock = database.__set__('mongoClient', mongoClientMock);
    // here we don't want to be connected
    // no need to revert though, as this will be assigned before each test anyway
    database.__set__({
      isClientConnected: false,
      fatigueDatabase: undefined
    });

    expect(database.__get__('isClientConnected'), 'the mongo client shouldn\'t already be connected').toBe(false);

    // make a connection attempt (which will fail)
    database.__get__('connectClient')();

    expect(database.__get__('isClientConnected'), 'the connection attempt should fail').toBe(false);
    expect(mongoClientMock.connectedTo.length).toBe(1);
    expect(database.__get__('fatigueDatabase')).toBeUndefined();

    // tell the db that it is connected (again, no need to revert)
    database.__set__('isClientConnected', true);

    // connection attempt shouldn't be made if the db thinks it is already connected
    database.__get__('connectClient')();
    expect(database.__get__('isClientConnected'), 'the connection should remain established').toBe(true);
    expect(mongoClientMock.connectedTo.length).toBe(1);
    expect(database.__get__('fatigueDatabase')).toBeUndefined(); // we didn't actually connect to a db

    // done
    revertMongoClientMock();
  });
});

describe('database - findOne', function () {
  it('should properly hand over "empty" requests', function () {
    database.findUniqueDocument('foobar')
      .then(function () {
        console.log("FOOOOOOOO");
        console.log(JSON.stringify(fatigueDatabaseMock));
      })
    .catch (function (err) {
      console.error(err);
    });
    console.log("DONE");
  });
});

