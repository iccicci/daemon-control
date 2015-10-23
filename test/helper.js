"use strict";

var cp = require("child_process");
var dc = require("..");
var fs = require("fs");

function simple(done, filename, options, daemon) {
	var ret = dc(daemon || function() {}, filename, options);

	ret.ev = {};
	ret.once("error", function(err) { ret.ev.err = err; done(); });

	ret.stdout = "";
	ret._write = function(msg) { ret.stdout += msg; };

	return ret;
}

function daemon(done, self, parameter, callback) {
	fs.unlink("daemon.pid", function() {
		simple(done, "daemon.pid", { stdio: ["ignore", "ignore", "ignore", "pipe"], hooks: { start: function(cb, child) {
			self.pid = child.pid;
			cb(false);
			child.stdio[3].on("end", callback);
		} } });
		process.argv = [process.argv[0], "test/helper.js", "start", parameter];
	});
}

function wait(pid, done, count) {
	if(! count)
		count = 0;

	if(count == 40)
		return done();

	try { process.kill(pid, 0); }
	catch(e) { return done(); }

	setTimeout(wait.bind(null, pid, done, count + 1), 50);
}

module.exports = {
	dc:   simple,
	dcd:  daemon,
	wait: wait
};

if(process.argv[2] == "wait") {
	var to = setTimeout(function() {}, 5000);

	process.on("SIGHUP",  to.unref.bind(to));
	process.on("SIGTERM", to.unref.bind(to));
	fs.closeSync(3);
}

if(process.argv[2] == "delay") {
	var to = setTimeout(function() {}, 5000);

	process.on("SIGTERM", setTimeout.bind(null, to.unref.bind(to), 1100));
	fs.closeSync(3);
}
