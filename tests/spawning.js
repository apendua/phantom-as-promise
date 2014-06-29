var expect = require('chai').expect;
var PhantomAsPromise = require('../phantom-as-promise').PhantomAsPromise;

describe('Spawning phantom.', function () {

  var phantomAsPromise = new PhantomAsPromise({
    phantomPath:'@@@',
    ignoreErrorPattern: /execvp/
  });

  it('should produce an error when a bad path is given.', function () {
    return phantomAsPromise
      .then(function (phantom) {
        phantom && phantom.exit();
        throw new Error('error not thrown');
      }, function (err) {
        expect(err).to.exist;
      });
  });

});
