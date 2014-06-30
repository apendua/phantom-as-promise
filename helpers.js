var path = require('path');
var crypto = require('crypto');
var expect = require('chai').expect;
var Promise = require('es6-promise').Promise;

var DEFAULT_TIMEOUT = parseInt(process.env.DEFAULT_TIMEOUT) || 10000;

module.exports = {

  useFixtures: function () {
    return this.injectJs(path.join(__dirname, 'fixtures.js'));
  },

  always: function (callback) {
    return this.then(callback, callback);
  },

  sleep: function (timeout) {
    return this.then(function () {
      return new Promise(function (resolve, reject) {
        setTimeout(resolve, timeout || DEFAULT_TIMEOUT);
      });
    });
  },

  eval: function (code) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1).map(function (arg) {
      return JSON.stringify(arg);
    });
    // XXX pick some unique names for our control events
    var res_event = crypto.randomBytes(8).toString('hex');
    var err_event = crypto.randomBytes(8).toString('hex');
    // create a promise object
    return self.then(function () {
      if (code.length !== args.length) {
        throw new Error("In the 'eval' promise you required " + code.length + " arguments, yet " + args.length + " was provided.");
      }
      return new Promise(function (resolve, reject) {
        self.once(res_event, function (res) { resolve(res); });
        self.once(err_event, function (err) {
          reject(new Error(typeof err === 'object' ? err.message : err));
        });
        self.evaluate(
          'function () {\n' +
          '  try {\n' +
          '    var res = (' + code.toString() + '(' + args.join(', ') + '));\n' +
          '    emit("' + res_event + '", res);\n' +
          '  } catch (err) {\n' +
          '    emit("' + err_event + '", "[in injected code] " + err.toString());\n' +
          '  }\n' +
          '}\n'
        );
      }); // new Promise
    }); // then
  }, // eval

  promise: function (code) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1).map(function (arg) {
      return JSON.stringify(arg);
    });
    // XXX pick some unique names for our control events
    var res_event = crypto.randomBytes(8).toString('hex');
    var err_event = crypto.randomBytes(8).toString('hex');
    // ---------------------------------------------------
    // create a promise object
    return self.then(function () {
      if (args.length > Math.max(code.length - 2, 0)) {
        throw new Error('You passed too many arguments: ' + args.length + ' given but expected ' + (code.length - 2) + '.');
      } else {
        // TODO: also check if arguments are named properly
        args.unshift('function (err) { emit("' + err_event + '", err); }'); // reject
        args.unshift('function (res) { emit("' + res_event + '", res); }'); // resolve
      }
      return new Promise(function (resolve, reject) {
        self.once(res_event, function (res) { resolve(res); });
        self.once(err_event, function (err) {
          reject(typeof err === 'object' ? err.message : err);
        });
        self.evaluate(
          // allow defining some timeout
          'function () {\n' +
          '  var either = function (first) {\n' +
          '    return {\n' +
          '      or: function (second) {\n' +
          '        return function (arg1, arg2) {\n' +
          '          return arg1 ? first(arg1) : second(arg2);\n' +
          '        };\n' +
          '      }\n' +
          '    };\n' +
          '  };\n' +
          '  try {\n' +
          '    (' + code.toString() + ')(' + args.join(', ') + ');\n' +
          '  } catch (err) {\n' +
          '    emit("' + err_event + '", err.toString());\n' +
          '  }\n' +
          '}\n'
        );
      }); // new Promise
    }); // then
  }, // promise


  wait: function (timeout, message, code) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 3).map(function (arg) {
      return JSON.stringify(arg);
    });
    var res_event = crypto.randomBytes(8).toString('hex');
    var err_event = crypto.randomBytes(8).toString('hex');
    return self.then(function () {
      if (args.length > code.length) {
        throw new Error('You passed too many arguments: ' + args.length + ' given but expected ' + code.length + '.');
      }
      return new Promise(function (resolve, reject) {
        self.once(res_event, function (res) {
          resolve(typeof res !== 'boolean' ? res : undefined);
        })
        self.once(err_event, function (err) {
          reject(new Error(typeof err === 'object' ? err.message : err));
        });
        self.evaluate(
          'function () {\n' +
          '  var handle = null;\n' +
          '  (function test() {\n' +
          '    var result;\n' +
          '    try {\n' +
          '      result = (' + code.toString() + '(' + args.join(', ') + '));\n' +
          '      if (result) {\n' +
          '        emit("' + res_event + '", result);\n' +
          '      } else {\n' +
          '        handle = setTimeout(test, 200);\n' + // repeat after 1/5 sec.
          '      }\n' +
          '    } catch (err) {\n' +
          '      emit("' + err_event + '", err.toString());\n' +
          '    }\n' +
          '  }());\n' +
          '  setTimeout(function () {\n' +
          '    clearTimeout(handle);\n' +
          '    emit("' + err_event + '", "I have been waiting for ' + timeout + ' ms ' + message + ', but it did not happen.");\n' +
          '  }, ' + timeout + ');\n' +
          '}\n'
        );
      }); // new Promise
    }); // then
  }, // wait

  waitForDOM: function (selector, timeout) {
    return this.wait(timeout || DEFAULT_TIMEOUT, 'until element ' + selector + ' is present', function (selector) {
      return !!document.querySelector(selector);
    }, selector);
  },

};
/*
var makeBoundedPromise = function (self, constructor, connector, promise) {
  // proxy the promise methods


  self.evalAsync = function (code) {
    var args = _.toArray(arguments).splice(1).map(function (arg) {
      return JSON.stringify(arg);
    });
    // for safety make sure that the number of arguments is ok
    while (args.length < code.length - 1) {
      args.push("undefined");
    }
    // XXX pick some unique names for our control events
    var res_event = crypto.randomBytes(8).toString('hex');
    var err_event = crypto.randomBytes(8).toString('hex');
    // ---------------------------------------------------
    if (args.length === code.length - 1) {
      // the last argument is the promise handle
      args.push('{\n' +
        '  resolve : function (res) { emit("' + res_event + '", res); },\n' +
        '  reject  : function (err) { emit("' + err_event + '", err); },\n' +
        '  done    : function (err, res) { err ? emit("' + err_event + '", err) : emit("' + res_event + '", res) }\n' +
      '}');
    }
    // create a promise object
    return self.then(function () {
      return new Promise(function (resolve, reject) {
        connector.eval(
          // allow defining some timeout
          'function () {\n' +
          '  try {\n' +
          '    (' + code.toString() + '(' + args.join(', ') + '));\n' +
          '  } catch (err) {\n' +
          '    emit("' + err_event + '", err.toString());\n' +
          '  }\n' +
          '}\n'
        ).once(res_event, function (res) { resolve(res); })
         .once(err_event, function (err) {
          reject(new Error(_.isObject(err) ? err.message : err));
        });
      }); // PROMISE
    }); // THEN
  }; // EVAL ASYNC

  // switch to another connector after we're done with the current promise

  
}; // makeBoundedPromise

// GENERIC PROMISE

GenericPromise.prototype = {

  get: function (url) {
    return this.promise(function (resolve, reject, url) {
      HTTP.get(url, either(reject).or(resolve));
    }, url);
  },

  post: function (url, data) {
    // TODO: check why we got a parse error when data is undefined
    return this.promise(function (resolve, reject, url, data) {
      HTTP.post(url, { data: data }, either(reject).or(resolve));
    }, url, data || {});
  },

  updateShow: function (showId, updates) {
    return this.eval(function (showId, updates) {
      Shows.update({ _id: showId }, { $set: updates });
    }, showId, updates);
  },

};

_.extend(ClientPromise.prototype, {

  signUp: function (options) {
    return this.promise(function (resolve, reject, options) {
      Accounts.createUser(options, either(reject).or(resolve));
    }, options);
  },

  login: function (user, password) {
    return this.evalAsync(function (user, password, promise) {
      Meteor.loginWithPassword(user, password, promise.done);
    }, user, password);
  },

  logout: function () {
    return this.evalAsync(function (promise) {
      Meteor.logout(promise.done);
    });
  },

  getText: function (selector) {
    return this.waitForDOM(selector).eval(function (selector) {
      return $(selector).text();
    }, selector);
  },

  click: function (selector, timeout) {
    return this.waitForDOM(selector).eval(function (selector) {
      click(selector);
    }, selector);
  },

  setValue: function (selector, value) {
    return this.waitForDOM(selector).eval(function (selector, value) {
      $(selector).val(value); // XXX I am not sure if we need this blur
    }, selector, value);
  },

  focus: function (selector) {
    return this.waitForDOM(selector).eval(function (selector) {
      $(selector).focus();
    }, selector);
  },
  
  blur: function (selector) {
    return this.waitForDOM(selector).eval(function (selector) {
      $(selector).blur();
    }, selector);
  },

  sendKeys: function (selector, keys) {
    return this.waitForDOM(selector)
               .focus(selector)
               .sendEvent('keyPress', keys)
               .blur(selector);
  },

  getValue: function (selector) {
    return this.waitForDOM(selector).eval(function (selector) {
      return $(selector).val();
    }, selector);
  },

  getClass: function (selector) {
    return this.waitForDOM(selector).eval(function (selector) {
      var $query = $(selector);
      return $query.length > 0 ? $query.get(0).className : '';
    }, selector);
  },

  waitForMeteor: function (timeout) {
    return this.wait(timeout || DEFAULT_TIMEOUT, 'until Meteor is loaded', function () {
      return !!window.Meteor;
    });
  },

  waitForRoute: function (path, timeout) {
    return this.eval(function (path) {
      Router.go(path);
    }, path)
    .wait(timeout || DEFAULT_TIMEOUT, 'until current path is ' + path, function (path) {
      var controller = Router.current();
      if (controller && controller.path === path && controller.ready()) {
        return true;
      }
    }, path);
  },
  
  waitUntilGone: function (selector) {
    return this.wait(timeout || DEFAULT_TIMEOUT, 'until element ' + selector + ' is gone', function (selector) {
      return $(selector).length === 0;
    }, selector);
  },

  waitUntilNotVisible: function (selector) {
    return this.wait(timeout || DEFAULT_TIMEOUT, 'until element ' + selector + ' is gone', function (selector) {
      return !$(selector).is(':visible');
    }, selector);
  },
  /*
  waitForDOM: function (selector, timeout) {
    return this.promise(function (resolve, reject, selector, timeout) {
      var handle;
      try {
        waitForDOM(selector, function () {
          // XXX I am not sure if we have to clearTimeout
          handle && clearTimeout(handle);
          resolve();
        });
        if (timeout) {
          handle = setTimeout(function () {
            reject('Element ' + selector + ' not found.');
          }, timeout);
        }
      } catch (err) {
        reject(err);
      }
    }, selector, timeout !== undefined ? timeout : DEFAULT_TIMEOUT );
    // TODO: this constant should be defined somewhere else
  },

  waitForRoute: function (path, timeout) {
    return this.promise(function (resolve, reject, path, timeout) {
      var handle;
      try {
        waitForRoute(path, function () {
          handle && clearTimeout(handle);
          resolve();
        });
        if (timeout) {
          handle = setTimeout(function () {
            reject('Timout while waiting for route ' + path + '.');
          }, timeout);
        }
      } catch (err) {
        reject(err);
      }
    }, path, timeout !== undefined ? timeout : DEFAULT_TIMEOUT );
  },
  
  waitAndClick: function (selector) {
    return this.waitForDOM(selector).click(selector);
  },
  
  waitUntilGone: function (selector) {
    return this.evalAsync(function (selector, promise) {
      try {
        waitForDOM(function () {
          return $(selector).length === 0;
        }, promise.resolve);
      } catch (err) {
        promise.reject(err);
      }
    }, selector);
  },

  waitUntilNotVisible: function (selector) {
    return this.evalAsync(function (selector, promise) {
      try {
        waitForDOM(function () {
          return !$(selector).is(':visible');
        }, promise.resolve);
      } catch (err) {
        promise.reject(err);
      }
    }, selector);
  },
  */

/*  afterFlush: function () {
    return this.promise(function (resolve) {
      Deps.afterFlush(resolve);
    });
  },

  checkIfExist: function (selector) {
    return this.eval(function (selector) {
      return $(selector).length > 0;
    }, selector);
  },

  checkIfVisible: function (selector) {
    return this.eval(function (selector) {
      return $(selector).is(':visible');
    }, selector);
  },

  // ASSERTIONS

  expectExist: function (selector) {
    return this.checkIfExist(selector).then(function (exist) {
      expect(exist).to.be.true;
    });
  },

  expectNotExist: function (selector) {
    return this.checkIfExist(selector).then(function (exist) {
      expect(exist).to.be.false;
    });
  },

  expectVisible: function (selector) {
    return this.checkIfVisible(selector).then(function (visible) {
      expect(visible).to.be.true;
    });
  },

  expectNotVisible: function (selector) {
    return this.checkIfVisible(selector).then(function (visible) {
      expect(visible).to.be.false;
    });
  },

  expectValueToBeEqual: function (selector, reference) {
    return this.getValue(selector).then(function (value) {
      expect(value).to.be.eql(reference);
    });
  },

  expectTextToBeEqual: function (selector, value) {
    return this.getText(selector).then(function (text) {
      expect(text).to.be.eql(value);
    });
  },

  expectTextToContain: function (selector, value) {
    return this.getText(selector).then(function (text) {
      expect(text).to.contain(value);
    });
  },

  expectToHaveClass: function (selector, value) {
    return this.getClass(selector).then(function (style) {
      expect(style).to.contain(value);
    });
  },

  // helpers

  // TODO: stream this one over some socket and view it in a browser
  //       or, we can just use phantomJS to take snapshots, hmm?
  logHTML: function (selector) {
    return this.waitForDOM(selector)
      .eval(function (selector) {
        return $(selector).html();
      }, selector)
      .then(function (html) {
        console.log(html);
      });
  },

});

// ALIASES

ClientPromise.prototype.expectValueToEqual = ClientPromise.prototype.expectValueToBeEqual;
ClientPromise.prototype.expectTextToEqual  = ClientPromise.prototype.expectTextToBeEqual;
*/