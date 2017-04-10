var async = require("async");
var csv = require("fast-csv");
var fs = require("fs");
var through = require("through2");

module.exports = function(input, output, feedFile, opts) {
  async.waterfall([function(next) {
    var feeds = {};
    var buf = "";

    var section = -1;
    var sections = [[], [], [], []];

    console.log("processing sections");

    fs.createReadStream(feedFile)
      .on("data", function(data) {
        buf += data.toString();

        var lines = buf.split("\n");
        buf = lines.pop();

        for(var i = 0; i < lines.length; i++) {
          let line = lines[i].replace(/[\r\n]+$/, "");

          if(line.length === 0) continue;

          if(line.slice(0, 2) === "%,") {
            section++;

            continue;
          }

          if(section === -1) { // input can be either just the CSV section or the entire pnp file
            sections[1].push(line);
          } else {
            sections[section].push(line);
          }
        }
      })
      .on("end", function() {
        next(null, sections);
      })
  }, function(sections, next) {
    console.log("associating parts");

    var components = [];
    var len = sections[1].length;

    for(var i = 0; i < len; i++) {
      let section = sections[1][i].split(",");

      components[section[6]] = {
        x: section[3],
        y: section[4],
        feed: section[5],
        slot: section[2]
      }
    }

    next(null, components);
  }, function(feeds, next) {
    var rs = fs.createReadStream(input);
    var ws = fs.createWriteStream(output);
    var wsCsv = csv.createWriteStream();
    var data = "";
    var seq = 0;

    var tr = through.obj(function(chunk, enc, done) {
      data += chunk.toString();

      var lines = data.split("\n");
      data = lines.pop();

      for(var i = 0, line; i < lines.length; i++) {
        line = lines[i];

        var match = line.replace(/[\ ]+/g, " ").split(" ");
        var p = match[1];
        var x = match[3];
        var y = match[4];
        var r = match[5];

        if(!feeds[p]) {
          if(!opts.quite)
            console.warn("No feed found for part: %s", p);

          continue;
        }

        var feed = feeds[p];

        this.push([ 0, seq++, feed.slot, x, y, r ].join(",") + "\n");
      };

      done();
    });

    rs.pipe(tr);
    tr.pipe(ws);
  }]);
}
