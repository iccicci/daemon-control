/*jslint evil: true */
"use strict";

var child_process = require("child_process");
var EventEmitter  = require("events");
var fs            = require("fs");
var path          = require("path");
var util          = require("util");

function DaemonControl(daemon, filename, options, timeout) {
	if(! (this instanceof DaemonControl))
		return new DaemonControl(daemon, filename, options, timeout);

	EventEmitter.call(this);

	this.daemon   = daemon;
	this.filename = filename;
	this.options  = options;
	this.timeout  = timeout;

	process.nextTick(this._doAll.bind(this));
}

util.inherits(DaemonControl, EventEmitter);

module.exports = DaemonControl;

var commands = {
	start:   null,
	stop:    null,
	restart: null,
	status:  null,
	help:    null
};

DaemonControl.prototype._cmdline = function() {
	if(process.argv.length < 3)
		return false;

	if(process.argv[2] in commands)
		return process.argv[2];

	return false;
};

DaemonControl.prototype._doAll = function() {
	try {
		this._init();
	}
	catch(e) {
		return this.emit("error", e);
	}

	if(process.env.__daemon_control)
		return this.daemon();

	var cmd = this._cmdline();

	if(! cmd) {
		if(this.listeners("syntax").length)
			return this.emit("syntax");

		return this._write("Usage:\nnode " + path.basename(process.argv[1]) + " {start|stop|restart|status|help} [...]\n");
	}

	eval("this._" + cmd + "();");
};

DaemonControl.prototype._help = function() {
	if(this.listeners("help").length)
		return this.emit("help");

	this._write("Usage:\nnode " + path.basename(process.argv[1]) + " {start|stop|restart|status|help} [...]\n\n");
	this._write("help      prints this screen\n");
	this._write("status    checks id daemon is running\n");
	this._write("start     launches the daemon\n");
	this._write("stop      stops the daemon\n");
	this._write("restart   stops than starts the daemon\n");
};

DaemonControl.prototype._init = function() {
	if(! this.daemon)
		throw new Error("DaemonControl: missing daemon parameter");

	if("function" != typeof this.daemon)
		throw new Error("DaemonControl: daemon parameter is not a function");

	if(! this.filename)
		throw new Error("DaemonControl: missing filename parameter");

	if("string" != typeof this.filename)
		throw new Error("DaemonControl: filename parameter is not a string");

	if("undefined" == typeof this.options)
		this.options = {};
	else
		if("object" != typeof this.options)
			throw new Error("DaemonControl: options parameter is not an object");

	if("undefined" == typeof this.timeout)
		this.timeout = 5000;
	else {
		this.timeout = parseInt(this.timeout);

		if(isNaN(this.timeout))
			throw new Error("DaemonControl: timeout parameter is not an integer number");

		if(this.timeout <= 0)
			throw new Error("DaemonControl: timeout parameter is not a non zero positive integer number");
	}

	if(! ("cwd" in this.options))
		this.options.cwd = process.cwd;
	else
		if("string" != typeof this.options.cwd)
			throw new Error("DaemonControl: cwd option is not a string");

	if(! ("env" in this.options))
		this.options.cwd = process.env;
	else
		if("object" != typeof this.options.env)
			throw new Error("DaemonControl: env option is not an object");

	if(! ("stdio" in this.options))
		this.options.stdio = "ignore";

	if(! ("detached" in this.options))
		this.options.detached = true;
};

DaemonControl.prototype._status = function(callback) {
	var self = this;
	var done = function(pid) {
		if(! pid)
			self._write("Daemon is not running\n");
		else
			self._write("Daemon is running with pid: " + pid + "\n");

		var num = self.listeners("status").length;

		if(num > 1)
			return self.emit("error", new Error("DaemonControl: more than one listener bount to 'status' event."));

		if(callback)
			callback(pid);
	};

	fs.readFile(this.filename, function(err, data) {
		if(err && err.code != "ENOENT")
			return self.emit("error", err);

		if(err)
			return done(null);

		var pid = parseInt(data);

		if(isNaN(pid))
			return done(null);

		try { process.kill(pid, 0); }
		catch(e) { return done(null); }

		done(pid);
	});
};

DaemonControl.prototype._write = function(msg) {
	process.stdout.write(msg);
};
/*
function daemon(options) {

}


console.log(process.argv);

var child = child_process.spawn("/bin/basho", ["-c", "sleep 2"], {stdio:"inherit"});

console.log(child.pid);

child.on("error", function(err) {
	console.log(err);
});
child.unref();
console.log(typeof true);
*/
