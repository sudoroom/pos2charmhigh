var async = require("async");
var csv = require("fast-csv");
var fs = require("fs");
var through = require("through2");

module.exports = function(input, output, feedFile, opts) {
  var data = "";
  async.waterfall([function(next) {
    var feeds = {};

    fs.createReadStream(feedFile).pipe(csv())
      .on("data", function(data){
        feeds[data[6]] = {
          x: data[3],
          y: data[4],
          feed: data[5],
          slot: data[2]
        }
      })
    .on("end", function() {
      next(null, feeds)
    });
  }, function(feeds, next) {
    var rs = fs.createReadStream(input);
    var ws = fs.createWriteStream(output);
    var wsCsv = csv.createWriteStream();
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

        this.push([ 0, seq++, feed.slot, x, y, r ]);
      };

      done();
    });

    rs.pipe(tr);
    tr.pipe(wsCsv);
    wsCsv.pipe(ws);
  }]);
}
