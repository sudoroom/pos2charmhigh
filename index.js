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

    fs.createReadStream(feedFile, { encoding: "latin1" })
      .on("data", function(data) {
        buf += data.toString();

        var lines = buf.split("\r\n");
        buf = lines.pop();

        for(var i = 0; i < lines.length; i++) {
          let line = lines[i].replace(/[\r\n]+$/, "");

          if(line.length === 0) continue;

          if(line.slice(0, 2) === "%,") {
            section++;
          }

          if(section === 3 && sections[3].length > 0) continue;

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

    next(null, components, sections);
  }, function(feeds, sections, next) {
    var data = "";
    var seq = 0;

    var tr = through(function(chunk, enc, done) {
      data += chunk.toString();

      var lines = data.split("\n");
      data = lines.pop();

      for(var i = 0, line; i < lines.length; i++) {
        line = lines[i];

        var match = line.replace(/[\ ]+/g, " ").split(" ");
        var p = match[1];
        var x = match[3];
        var y = match[4];
        var r = Math.round(match[5] - 90);

        if(r < 0) r += 360;

        if(!feeds[p]) {
          if(!opts.quite)
            console.warn("No feed found for part: %s", p);

          continue;
        }

        var feed = feeds[p];

        this.push([ ++seq, 1, feed.slot, Math.abs(x), Math.abs(y), r, 0.50, 0, 100, null, null, null ].join(",") + "\r\n");
      };

      done();
    });

    next(null, tr, sections);
  }], function(err, tr, sections) {
    var rs = fs.createReadStream(input, { encoding: "latin1" });
    var ws = fs.createWriteStream(output, { encoding: "latin1" });

    var i = 0;

    async.forEachSeries(sections, function(section, next) {
      ws.write(section.join("\r\n") + (++i < 4 ? "\r\n\r\n" : "\r\n"), next);
    }, function() {
      rs.pipe(tr);
      tr.pipe(ws).on("close", function() {
      });
    });
  });
}
