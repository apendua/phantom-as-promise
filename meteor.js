var helpers = require('./helpers');

module.exports = {

  GET: function (url) {
    return this.promise(function (resolve, reject, url) {
      HTTP.get(url, either(reject).or(resolve));
    }, url);
  },

  POST: function (url, data) {
    // TODO: check why we got a parse error when data is undefined
    return this.promise(function (resolve, reject, url, data) {
      HTTP.post(url, { data: data }, either(reject).or(resolve));
    }, url, data || {});
  },

  signUp: function (options) {
    return this.promise(function (resolve, reject, options) {
      Accounts.createUser(options, either(reject).or(resolve));
    }, options);
  },

  login: function (user, password) {
    return this.promise(function (resolve, reject, user, password) {
      Meteor.loginWithPassword(user, password, either(reject).or(resolve));
    }, user, password);
  },

  logout: function () {
    return this.promise(function (resolve, reject) {
      Meteor.logout(either(reject).or(resolve));
    });
  },

  waitForMeteor: function (timeout) {
    return this.wait(timeout || helpers.default_timeout, 'until Meteor is loaded', function () {
      return !!window.Meteor;
    });
  },

  waitForRoute: function (path, timeout) {
    return this.eval(function (path) {
      Router.go(path);
    }, path)
    .wait(timeout || helpers.default_timeout, 'until current path is ' + path, function (path) {
      
      var controller = Router.current();
      var pathOK = (window.location.pathname + window.location.search + window.location.hash === path);

      if (controller && pathOK && controller.ready()) {
        return true;
      } else {
        Router.go(path);
      }
    }, path);
  },
  
  afterFlush: function () {
    return this.promise(function (resolve) {
      Deps.afterFlush(resolve);
    });
  },

};
