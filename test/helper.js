"use strict";

var cp = require("child_process");
var dc = require("..");

function exec(done, cmd, cb) {
	cp.exec(cmd, function(error, stdout, stderr) {
		if(error) {
			console.log(error, stdout, stderr);

			return done();
		}

		cb();
	});
}

function _dc(done, daemon, filename, options, timeout) {
	var ret = dc(daemon, filename, options, timeout);

	ret.ev = { single: 0, multi: 0, rotation: 0, rotated: [] };
	ret.on("rotation", function() { ret.ev.rotation++; });
	ret.on("rotated", function(filename) { ret.ev.rotated.push(filename); });
	ret.once("error", function(err) { ret.ev.err = err; done(); });

	return ret;
}

module.exports = {
	exec: exec,
	dc:   _dc
};
