var Phantom = require('node-phantom-simple');
var Promise = require('es6-promise').Promise;

function either(first) {
  return {
    or: function (second) {
      return function (arg1, arg2) {
        return arg1 ? first(arg1) : second(arg2);
      };
    }
  };
}

module.exports = {
  PhantomAsPromise: function (options) {
    return new PhantomAsPromise(new Promise(function (resolve, reject) {
      Phantom.create(either(reject).or(resolve), options);
    }));
  },
};

function PhantomAsPromise(phantom, promise) {
  var self = this;

  if (!promise) {
    promise = phantom;
  }

  [ 'then', 'catch' ].forEach(function (name) {
    self[name] = function () {
      return new PhantomAsPromise(phantom, promise[name].apply(promise, arguments));
    }
  });

  [
    'createPage',
    'injectJs',
    'addCookie',
    'clearCookies',
    'deleteCookie',
    'set',
    'get',
    'exit'

  ].forEach(function (method) {
    self[method] = function () {
      var args = Array.prototype.slice.call(arguments);
      return new PhantomAsPromise(phantom, Promise.all([ phantom, promise ])).then(function (all) {
        // after "phantom" and "promise" are fullfilled return another promise
        // which will be resolved or rejected as soon as the corresponding method is done
        var original = all[0][method];
        var callback = args[args.length-1];
        //---------------------------------------------
        return new Promise(function (resolve, reject) {
          if (typeof callback === 'function') {
            args[args.length-1] = function () {
              console.log('got result from', method);
              resolve(callback.apply(this, arguments));
            }
          } else {
            args.push(either(reject).or(resolve));
          }
          original.apply(all[0], args);
        });
      });
    }
  });

}
