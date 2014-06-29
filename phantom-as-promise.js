"use strict";

var events = require('events');
var Phantom = require('node-phantom-simple');
var Promise = require('es6-promise').Promise;
var path = require('path');
var util = require('util');

function either(first) {
  return {
    or: function (second) {
      return function (arg1, arg2) {
        return arg1 ? first(arg1) : second(arg2);
      };
    }
  };
}

var promesify_base = {
  always: function (callback) {
    return this.then(callback, callback);
  },
};

function promesify(config) {
  var methods;
  if (Array.isArray(config)) {
    methods = config; config = {};
  } else if (typeof config === 'object') {
    methods = config.methods || [];
  } else {
    config = {};
  }
  //--------------------------------------------------------------------------
  var constructor = config.factory || function constructor(operand, promise) {
    this._operand = operand;
    this._promise = promise || operand;
  }; // constructor
  //----------------------------------------------
  util.inherits(constructor, events.EventEmitter);
  //----------------------------------------------
  [ 'then', 'catch' ].forEach(function (name) {
    constructor.prototype[name] = function () {
      return new constructor(this._operand, this._promise[name].apply(this._promise, arguments));
    };
  });
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
  if (typeof config.helpers === 'object') {
    Object.keys(config.helpers).forEach(function (key) {
      constructor.prototype[key] = config.helpers[key];
    });
  }
  return constructor;
}

var PhantomAsPromise = promesify({
  //factory: function PhantomAsPromise(options) {
  //  this._operand = this._promise = new Promise(function (resolve, reject) {
  //    Phantom.create(either(reject).or(resolve), options);
  //  });
  //},
  methods: [
    'createPage', 'injectJs', 'addCookie', 'clearCookies', 'deleteCookie', 'set', 'get', 'exit'
  ]
});

PhantomAsPromise.prototype.page = function () {
  return new PageAsPromise(this.createPage());
};

var PageAsPromise = promesify({
  //constructor: function (operand, promise) {
  //  this._operand = operand.then(function (page) {
  //    page.onCallback = function () {
  //      console.log(arguments);
  //    }
  //    return page;
  //  });
  //  this._promise = promise || this._operand;
  //},
  helpers: require('./helpers'),
  methods: [
    'addCookie', 'childFramesCount', 'childFramesName', 'clearCookies', 'close',
    'currentFrameName', 'deleteCookie', 'evaluateJavaScript',
    'evaluateAsync', 'getPage', 'go', 'goBack', 'goForward', 'includeJs',
    'injectJs', 'open', 'openUrl', 'release', 'reload', 'render', 'renderBase64',
    'sendEvent', 'setContent', 'stop', 'switchToFocusedFrame', 'switchToFrame',
    'switchToFrame', 'switchToChildFrame', 'switchToChildFrame', 'switchToMainFrame',
    'switchToParentFrame', 'uploadFile',
    // these should be treated somewhat differently
    'evaluate', 'set', 'get', 'setFn'
  ]
});

//var original_open = PageAsPromise.prototype.open;
//PageAsPromise.prototype.open = function () {
//  return original_open.apply(this, arguments).injectJs(path.join(__dirname, 'fixtures.js'));
//};

// MODULE EXPORTS

//module.exports.PhantomAsPromise = PhantomAsPromise;
module.exports.PhantomAsPromise = function (options) {
  return new PhantomAsPromise(new Promise(function (resolve, reject) {
    Phantom.create(either(reject).or(resolve), options);
  }));
}

module.exports.PageAsPromise = PageAsPromise;
