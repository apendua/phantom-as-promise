"use strict";

var path = require('path');
var crypto = require('crypto');
var expect = require('chai').expect;
var Promise = require('es6-promise').Promise;

var DEFAULT_TIMEOUT = parseInt(process.env.DEFAULT_TIMEOUT) || 10000;

module.exports = {

  default_timeout: DEFAULT_TIMEOUT,

  useFixtures: function () {
    return this.injectJs(path.join(__dirname, 'fixtures.js'));
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

  waitUntilGone: function (selector, timeout) {
    return this.wait(timeout || DEFAULT_TIMEOUT, 'until element ' + selector + ' is gone', function (selector) {
      return !document.querySelector(selector);
    }, selector);
  },

  waitUntilNotVisible: function (selector, timeout) {
    return this.wait(timeout || DEFAULT_TIMEOUT, 'until element ' + selector + ' is hidden', function (selector) {
      var element = document.querySelector(selector);
      return !element || window.getComputedStyle(element).display === 'none';
    }, selector);
  },

  getText: function (selector) {
    return this.waitForDOM(selector).eval(function (selector) {
      var element = document.querySelector(selector);
      return element && element.innerHTML;
    }, selector);
  },

  getValue: function (selector) {
    return this.waitForDOM(selector).eval(function (selector) {
      var element = document.querySelector(selector);
      return element && element.value;
    }, selector);
  },

  getClass: function (selector) {
    return this.waitForDOM(selector).eval(function (selector) {
      var element = document.querySelector(selector);
      return (element && element.className) || '';
    }, selector);
  },

  click: function (selector, timeout) {
    return this.waitForDOM(selector).eval(function (selector) {
      click(selector);
    }, selector);
  },

  setValue: function (selector, value) {
    return this.waitForDOM(selector).eval(function (selector, value) {
      var element = document.querySelector(selector);
      if (element) {
        element.value = value;
      }
    }, selector, value);
  },

  focus: function (selector) {
    return this.waitForDOM(selector).eval(function (selector) {
      var element = document.querySelector(selector);
      element && element.focus();
    }, selector);
  },
  
  blur: function (selector) {
    return this.waitForDOM(selector).eval(function (selector) {
      var element = document.querySelector(selector);
      element && element.blur();
    }, selector);
  },

  sendKeys: function (selector, keys) {
    return this.waitForDOM(selector)
               .focus(selector)
               .sendEvent('keyPress', keys)
               .blur(selector);
  },

  // LOGGING

  snapshot: function () {
    return this.render('./snapshots/' + (new Date()).toString() + '.png');
  },

  // ASSERTIONS

  checkIfExist: function (selector) {
    return this.eval(function (selector) {
      return !!document.querySelector(selector);
    }, selector);
  },

  checkIfVisible: function (selector) {
    return this.eval(function (selector) {
      var element = document.querySelector(selector);
      return !!element && window.getComputedStyle(element).display !== 'none';
    }, selector);
  },

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

  expectValueToEqual: function (selector, reference) {
    return this.getValue(selector).then(function (value) {
      expect(value).to.be.eql(reference);
    });
  },

  expectTextToEqual: function (selector, value) {
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

};

/*

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

*/