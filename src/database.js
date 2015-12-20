var request = require('request'),
    restify = require('restify'),
    sha1 = require('sha1'),

    //log = require('./logger').log.child({component: 'database'}),
    mongoose = require('mongoose'),

    config = require('./config');

const databaseUrl = config.database.host + ':' + config.database.port + '/',
      databaseName = 'tv-shows',
      databaseAddress = 'mongodb://' + databaseUrl + databaseName;

var subscriptionSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true },
      searchParameters: String,
      lastSeason: Number,
      lastEpisode: Number,
      creationTime: Date,
      lastModified: Date,
      lastSeasonUpdateCheck: Date,
      lastEpisodeUpdateCheck: Date
    });

subscriptionSchema.methods.getReturnable = function () {
  var returnable = JSON.parse(JSON.stringify(this));

  // remove MongoDB id
  delete returnable._id;

  // remove Mongoose document version number
  delete returnable.__v;

  return returnable;
};

subscriptionSchema.pre('save', function(next) {
  var currentDate = new Date();
  this.lastModified = currentDate;

  // if creationTime doesn't exist, add it
  if (!this.creationTime)
    this.creationTime = currentDate;

  next();
});

var Subscription = mongoose.model('Subscription', subscriptionSchema);

mongoose.connect(databaseAddress);

exports.Subscription = Subscription;

