var Phantom = require('node-phantom-simple');
var Promise = require('es6-promise').Promise;

module.exports = {

  Phantom: function (options) {
    return new Promise(function (resolve, reject) {
      phantom.create(function (err, phantom) {
        if (err) {
          reject(err);
        } else {
          resolve(wrap(phantom));
        }
      }, options);
    });
  },

}

function wrap(phantom) {
  var wrapped = Object.create(phantom);
  [ 'createPage',
    'injectJs',
    'addCookie',
    'clearCookies',
    'deleteCookie',
    'set',
    'get',
    'exit'
  ].forEach(function (method) {
    var original = phantom[method];
    wrapped[method] = function () {
      var callback = arguments[arguments.length-1];
      if (typeof callback === 'function') {
        return original.apply(phantom, arguments);
      } else {
        return new Promise(function (resolve, reject) {
          var args = Array.prototype.slice.call(arguments);
          args.push(function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
          original.apply(phantom, args);
        });
      }
    }
  });
}
