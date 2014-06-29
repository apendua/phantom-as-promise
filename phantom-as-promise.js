"use strict";

var Phantom = require('node-phantom-simple');
var Promise = require('es6-promise').Promise;
var path = require('path');
var promesify = require('./promesify');

module.exports.PhantomAsPromise = PhantomAsPromise;
module.exports.PageAsPromise = PageAsPromise;

var _PhantomAsPromise = promesify({
  methods: [
    'createPage', 'injectJs', 'addCookie', 'clearCookies', 'deleteCookie', 'set', 'get', 'exit'
  ]
});

_PhantomAsPromise.prototype.page = function () {
  return new PageAsPromise(this.createPage());
};

function PhantomAsPromise (options) {
  return new _PhantomAsPromise(new Promise(function (resolve, reject) {
    Phantom.create(either(reject).or(resolve), options);
  }));
}

var _PageAsPromise = promesify({
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

var original_open = _PageAsPromise.prototype.open;
_PageAsPromise.prototype.open = function () {
  return original_open.apply(this, arguments).useFixtures();
};

function PageAsPromise(pagePromise) {
  return new _PageAsPromise(pagePromise.then(function (page) {
    page.onCallback = function () {
      console.log(arguments);
    }
    return page;
  }));
};

function either(first) {
  return {
    or: function (second) {
      return function (arg1, arg2) {
        return arg1 ? first(arg1) : second(arg2);
      };
    }
  };
}
