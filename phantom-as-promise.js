"use strict";

var Phantom = require('node-phantom-simple');
var Promise = require('es6-promise').Promise;
var path = require('path');
var promesify = require('./promesify');

function either(first) {
  return {
    or: function (second) {
      return function (arg1, arg2) {
        return arg1 ? first(arg1) : second(arg2);
      };
    }
  };
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
