# phantom-as-promise [![Build Status](https://travis-ci.org/apendua/phantom-as-promise.svg?branch=master)](https://travis-ci.org/apendua/phantom-as-promise)

**Phantom-as-Promise** is a minimalistic toolset which makes writing browser tests easy-peasy.
If you think that web drivers generally sucks, then this is probably a package for you.
If you think that there are still some other modern solutions like [zombie](http://zombie.labnotes.org/)
or [casperjs](http://casperjs.org/) then your're probably wrong. The first doesn't support
[meteor](https://www.meteor.com/) and is very slow, and the latter is not even a `nodejs` module, which is sad.

## So it is another PhantomJS wrapper, right?

Yes, and it's even worse. In its essence it is a thin wrapper on the top of another wrapper,
namely [node-phantom-simple](https://github.com/baudehlo/node-phantom-simple).
But this time we will brought your code to the world of promises with
a good help of [es6-promise](https://github.com/jakearchibald/es6-promise) library,
and as you will easily see - if you don't know it yet - it's a real game changer.
Assuming it would be written in [mocha](http://visionmedia.github.io/mocha/), the simplest
possible test would look more or less like this:

```javascript
describe('Repository persitence,', function () {

  var phantom = new require('phantom-as-promise').PhantomAsPromise();
  var page = null;
  
  before(function () {
    return page = phantom.page();
  });

  after(function () {
    return phantom.exit();
  });

  it('should be able to load the repository home page.', function () {
    return page.open('https://github.com/apendua/phantom-as-promise');
  });
  
});
```
Looking for more advanced examples? Look [here](https://github.com/apendua/phantom-as-promise/blob/master/tests/page.js).

## Installation

Nothing can be easier than:
```
npm install phantom-as-promise
```
right? Please note that for this package to work, you will need to have `phantomjs`
installed in your system. Don't like hidden dependencies? No problem, just install
```
npm install phantomjs
```
and update your code to something like this:
```javascript
var phantom = new PhantomAsPromise({
  phantomPath: require('phantomjs').path
});
```
Actually, it's a good thing that this package does not explicitly depend on `phantomjs`
as you can use `slimerjs` instead of `phantomjs` if you want to. Just replace names
in the above instructions and everything should work just fine.

## Disclaimer

This project is in a very early stage. In particular it has not even documented yet.
Please be patient and if you think you can contribute, please do!
