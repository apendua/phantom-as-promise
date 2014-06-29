var expect = require('chai').expect;
var PhantomAsPromise = require('../phantom-as-promise').PhantomAsPromise;
var either = require('../phantom-as-promise').eaither;

describe('Phantom API.', function () {

  var phantomAsPromise = null;
  
  before(function () {    
    return phantomAsPromise = new PhantomAsPromise();
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
  
  it('should be able to create page.', function () {
    return phantomAsPromise
      .createPage()
      .then(function (page) {
        expect(page).to.exist;
        expect(page.open).to.be.ok;
      });
  });

});
