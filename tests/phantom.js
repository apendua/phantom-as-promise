var expect = require('chai').expect;
var PhantomAsPromise = require('../phantom-as-promise').PhantomAsPromise;

describe('Phantom API.', function () {

  var phantomAsPromise = new PhantomAsPromise();

  before(function () {
    return phantomAsPromise;
  });

  after(function () {
    return phantomAsPromise.exit();
  });

  it('should be able to set property.', function () {
    var value = 'PhantomJS';
    return phantomAsPromise
      .set('foo', {})
      .set('foo.bar', value)
      .get('foo')
      .then(function (foo) {
        expect(foo).to.exist;
        expect(foo.bar).to.equal(value);
      });
  });

});
