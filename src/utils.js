/**
 * utils.js
 * Contains various util functions.
 */

var request = require('request'),
    promise = require('promise'),
    //sha1 = require('sha1'),

    config = require('./config');

exports.sendOkResponse = function (res, message, data, url, etag, lastModified) {
  'use strict';

  // assign always-same fields
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');

  // assign fields that may also be provided
  url && res.setHeader('Location', url);
  etag && res.setHeader('ETag', etag);
  lastModified && res.setHeader('Last-Modified', lastModified);

  // send response
  res.send({
    code: 'Success',
    message: message || '',
    href: url || '<unknown>',
    data: data || {},
  });
  res.end();
};

exports.sendBinaryResponse = function (res, data) {
  'use strict';

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/octetstream');
  res.send(data);
  res.end();
};

/*
exports.getDataFromRequestParams = function (requestParams) {
    'use strict';

    var property,
        data = {};

    // test for special cases
    if (requestParams === null || requestParams === undefined || typeof requestParams !== 'object') {
        return null;
    }
    if (requestParams.length !== undefined) {
        return null;
    }

    // iterate over properties but skip "indices" (keys that are integers)
    for (property in requestParams) {
        if (requestParams.hasOwnProperty(property)) {
            if (!/^\d+$/.test(property) && requestParams.hasOwnProperty(property)) {
                data[property] = requestParams[property];
            }
        }
    }

    // maybe the object comes from cURL...
    if (Object.keys(data).length === 1 && data[Object.keys(data)] === "") {
        data = JSON.parse(Object.keys(data)[0]);
    }

    return data;
};


function doesDocumentExist(dbName, documentId) {
    'use strict';

    var logging = 0;

    return new promise(function (fulfill, reject) {
        request.get(couchDbUrl + dbName + '/' + documentId, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                logging && console.log('Document "' + documentId + '" exists in database "' + dbName + '"');
                fulfill(true);
            } else if (!err && response.statusCode === 404) {
                logging && console.log('Document "' + documentId + '" does not exist in database "' + dbName + '"');
                reject(new customError.Error('DocumentNotFound', 404, 'Document "' + documentId + '" does not exist in database "' + dbName + '"'));
            } else {
                logging && console.log('Error occured when checking whether document "' + documentId + '" exists in database "' + dbName + '"');
                reject(new customError.Error('UnexpectedDatabaseResponse', 500, 'Something went wrong when accessing the database.'));
            }
        });
    });
}

exports.doesAccountExist = function (accountId) {
    'use strict';
    return doesDocumentExist('account', accountId);
};

exports.doesProductExist = function (productId) {
    'use strict';
    return doesDocumentExist('product', productId);
};

exports.doesOfferExist = function (offerId) {
    'use strict';
    return doesDocumentExist('offer', offerId);
};

exports.checkAccountCredentials = function (authEmail, authPassword) {
    'use strict';

    var logging = 0,
        hashedAuthPassword,
        account;

    return exports.doesAccountExist(sha1(authEmail)).then(function () {
        // only continue credential checks if account exists (no error was thrown by previous promise)
        return new promise(function (fulfill, reject) {
            request.get(accountUrl + sha1(authEmail), function (err, response, body) {
                if (!err && response.statusCode === 200) {
                    account = JSON.parse(body);
                    hashedAuthPassword = sha1(authPassword + account.passwordSalt);

                    if (hashedAuthPassword !== account.password) {
                        logging && console.log('Invalid credentials provided for account "' + sha1(authEmail) + '"');
                        reject(new customError.Error('InvalidUsernameOrPassword', 403, 'Invalid username or password provided.'));
                    } else {
                        logging && console.log('Valid credentials provided for account "' + sha1(authEmail) + '"');
                        fulfill(true);
                    }
                } else {
                    logging && console.log('Error occured when checking whether account credentials were valid for account "' + sha1(authEmail) + '"');
                    reject(new customError.Error('UnexpectedDatabaseResponse', 500, 'Something went wrong when accessing the database.'));
                }
            });
        });
    }, function (err) {
        return new promise(function (fulfill, reject) {
            // if error is DocumentNotFound return a different error message that makes more sense in the context of this function
            if (err.restCode === 'DocumentNotFound') {
                logging && console.log('Credentials provided for account "' + sha1(authEmail) + '" are for a non-existent account');
                reject(new customError.Error('InvalidUsernameOrPassword', 403, 'Invalid username or password provided.'));
            }
            reject(err);
        });
    });
};

exports.checkAccountEndpointCredentials = function (endpoint, authEmail, authPassword) {
    'use strict';

    return new promise(function (fulfill, reject) {
        if (endpoint !== sha1(authEmail)) {
            reject(new customError.Error('UsernameMismatch', 403, 'Authentication username does not match the account you are trying to access.'));
        }
        fulfill(exports.checkAccountCredentials(authEmail, authPassword));
    });
};
*/

