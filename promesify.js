"use strict"

var events = require('events');
var Promise = require('es6-promise').Promise;
var util = require('util');

var DEFAULT_TIMEOUT = parseInt(process.env.DEFAULT_TIMEOUT) || 10000;

module.exports = promesify;

function promesify(config) {
  var methods;
  if (Array.isArray(config)) {
    methods = config; config = {};
  } else if (typeof config === 'object') {
    methods = config.methods || [];
  } else {
    config = {};
  }
  //------------------------------------------------------
  var constructor = function Promesify(operand, promise) {
    this._operand = operand;
    this._promise = promise || operand;
  }; // constructor
  //----------------------------------------------
  //util.inherits(constructor, events.EventEmitter);
  //----------------------------------------------
  [ 'then', 'catch' ].forEach(function (name) {
    constructor.prototype[name] = function () {
      return new constructor(this._operand, this._promise[name].apply(this._promise, arguments));
    };
  });
  constructor.prototype.always = function (callback) {
    return this.then(callback, callback);
  };
  constructor.prototype.expectError = function (callback) {
    return this.then(function () {
      throw new Error('Expected an exception to be throw.')
    }, callback);
  };
  constructor.prototype.sleep = function (timeout) {
    return this.then(function () {
      return new Promise(function (resolve, reject) {
        setTimeout(resolve, timeout || DEFAULT_TIMEOUT);
      });
    });
  };
  constructor.prototype.switchTo = function (anotherOperand) {
    return new anotherOperand.constructor(anotherOperand, Promise.resolve(this._promise));
  };
  // add methods related to operand
  methods.forEach(function (method) {
    constructor.prototype[method] = function () {
      var args = Array.prototype.slice.call(arguments);
      return (new constructor(this._operand, Promise.all([ this._operand, this._promise ]))).then(function (all) {
        var original = all[0][method];
        var callback = args[args.length-1];
        //---------------------------------------------
        return new Promise(function (resolve, reject) {
          if (typeof callback === 'function') {
            args[args.length-1] = function () {
              resolve(callback.apply(this, arguments));
            }
          } else {
            args.push(either(reject).or(resolve));
          }
          original.apply(all[0], args);
        });
      });
    };
  });
  // add heleprs if there are any
  if (config.helpers) {
    if (!Array.isArray(config.helpers)) {
      config.helpers = [ config.helpers ];
    }
    config.helpers.forEach(function (helpers) {
      Object.keys(helpers).forEach(function (key) {
        if (constructor.prototype[key] !== undefined) {
          console.warn('helper ' + key + ' conflicts with some other method');
        }
        constructor.prototype[key] = helpers[key];
      });
    });
  }
  return constructor;
}

function either(first) {
  return {
    or: function (second) {
      return function (arg1, arg2) {
        return arg1 ? first(arg1) : second(arg2);
      };
    }
  };
}
