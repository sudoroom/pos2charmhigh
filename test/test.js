var fs = require("fs");
var spawn = require("child_process").spawn;
var test = require("tape");

var output = "./test/tmp.csv";
var fixture = "./test/fixture.csv";

var cp = spawn("./bin/cmd.js", [
  "-o", output,
  "-f", "./test/feeds.csv",
  "-i", "./test/top.pos",
  "--quite"
]);

cp.stdout.on("data", function(d) {
  console.log(d.toString());
});

cp.stderr.on("data", function(d) {
  console.log(d.toString());
});

cp.on("close", function() {
  test(function(t) {
    t.deepEqual(fs.readFileSync(output), fs.readFileSync(fixture), "output correct");

    t.end();
  });
});
