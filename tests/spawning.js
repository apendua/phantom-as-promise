var expect = require('chai').expect;
var Phantom = require('../phantom-as-promise').Phantom;

describe('Spawning phantom.', function () {

  it('should produce an error when a bad path is given.', function () {
    return new Phantom({
              phantomPath:'@@@',
              ignoreErrorPattern: /execvp/
            })
            .then(function (phantom) {
              phantom && phantom.exit();
              throw new Error('error not thrown');
            }, function (err) {
              expect(err).to.exist;
            });
  });
  
});
