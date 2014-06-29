var expect = require('chai').expect;
var Promise = require('es6-promise').Promise;
var PhantomAsPromise = require('../phantom-as-promise').PhantomAsPromise;
var PageAsPromise = require('../phantom-as-promise').PageAsPromise;
var either = require('../phantom-as-promise').eaither;
var http = require('http');

describe('Page API.', function () {

  var phantomAsPromise = null;
  var pageAsPromise = null;
  var server = null;
  var port = 1025 + Math.floor(Math.random() * 9000);
  
  before(function (done) {
    server = http.createServer(function (request, response) {
      response.writeHead(200, {"Content-Type": "text/html"});
      response.end('<html><head></head><body><h1>Hello World</h1></body></html>');
    }).listen(port, '127.0.0.1');
    server.once('listening', done);
  });

  before(function () {
    phantomAsPromise = new PhantomAsPromise();
    pageAsPromise = new PageAsPromise(phantomAsPromise.createPage());
    return Promise.all([
      phantomAsPromise, pageAsPromise
    ]);
  });  

  after(function () {
    return Promise.all([
      // close server
      new Promise(function (resolve) {
        server.close(resolve);
      }),
      // close page and phantom
      pageAsPromise.close().then(function () {
        return phantomAsPromise.exit();
      }),
    ]);
  });

  it('should be able to set page property.', function () {
    var value = 'PhantomJS';
    return pageAsPromise
      .set('foo', {})
      .set('foo.bar', value)
      .get('foo')
      .then(function (foo) {
        expect(foo).to.exist;
        expect(foo.bar).to.equal(value);
      });
  });

  describe('"Hello world" page', function () {
  
    before(function () {
      return pageAsPromise
        .open('http://127.0.0.1:' + server.address().port);
    });
    
    it('should be able to load hello world page.', function () {
      return pageAsPromise;
    });

  });
  
});
