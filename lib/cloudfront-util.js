
var crypto = require('crypto')
  , fs = require('fs')
  , util = require('util');

var CannedPolicy = function(url, expireTime) {
  this.url = url;
  this.expireTime = expireTime;

  this.toJson = function() {
    var policy = {
      Statement:[{
        Resource: this.url,
        Condition: {
          DateLessThan: {
            'AWS:EpochTime': this.expireTime
          }
        }
      }]
    };

    return JSON.stringify(policy);
  }
}

// TODO: Add functionality for custom policies.
exports.getSignedUrl = function(url, params) {
  // If an expiration time isn't set, default to 30 seconds.
  var defaultExpireTime = Math.round((new Date().getTime() + 30000) / 1000)
    , expireTime = params.expireTime || defaultExpireTime
    , policy = new CannedPolicy(url, expireTime)
    , sign = crypto.createSign('RSA-SHA1')
    , privateKeyString = params.privateKeyString;
  sign.update(policy.toJson());

  // Stringify private key if supplied as a file path.
  if (params.privateKeyPath) {
    var pem = fs.readFileSync(params.privateKeyPath)
      , privateKeyString = pem.toString('ascii');
  }

  var urlParams = [
    'Key-Pair-Id=' + params.keypairId,
    'Signature=' + sign.sign(privateKeyString, 'base64'),
    'Expires=' + expireTime
  ];
  var signedUrl = util.format('%s?%s', url, urlParams.join('&'));

  return signedUrl;
}
