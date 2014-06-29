#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var commander = require('commander');
var Mocha = require('mocha');

var specspath = path.join(__dirname, 'tests');
var specs = fs.readdirSync(specspath).filter(function(spec) {
  return /\.js$/.test(spec);
});

var options = commander
  .usage('[options]')
  .option('-r, --reporter <name>', 'mocha reporter [default: spec]', 'spec')
  .option('-t, --timeout <ms>', 'test-case timeout in milliseconds [default: 20000]', 20000)
  .parse(process.argv);


var mocha = new Mocha({
  ui       : "bdd",
  reporter : options.reporter,
  timeout  : options.timeout,
});

specs.forEach(function (name) {
  mocha.addFile(path.join(specspath, name));
});

mocha.run(function (failedCount) {
  var exitCode = (failedCount > 0) ? 1: 0;
  process.exit(exitCode);
});
