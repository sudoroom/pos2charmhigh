#!/usr/bin/env node

// translates KiCAD .pos files to Charmhigh PnP csv files
var pos2 = require("../");
var argv = require("minimist")(process.argv, {
  alias: {
    i: "input",
    o: "output",
    f: "feed",
    q: "quite"
  },
  boolean: [ "quite" ],
  default: {
    quite: false
  }
});

var input = argv.i || argv.input || argv._[2];
var output = argv.o || argv.output || argv._[3];

if(!input) {
  return console.log("Need input filename");
}

if(!output) {
  return console.log("Need output filename");
}

if(!argv.feed) {
  return console.log("Need feed csv filename");
}

pos2(input, output, argv.feed, {
  quite: argv.quite
});
