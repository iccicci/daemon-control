/*jslint evil: true */
"use strict";

var child_process = require("child_process");
var EventEmitter  = require("events");
var fs            = require("fs");
var path          = require("path");

function DaemonControl(daemon, filename, options) {
	if(! (this instanceof DaemonControl))
		return new DaemonControl(daemon, filename, options);

	EventEmitter.call(this);

	this.daemon   = daemon;
	this.filename = filename;
	this.options  = options;

	process.nextTick(this._main.bind(this));
}

DaemonControl.prototype = new EventEmitter();

module.exports = DaemonControl;

var commands = {
	start:   null,
	stop:    null,
	restart: null,
	status:  null,
	help:    null,
	reload:  null
};

DaemonControl.prototype._cmdline = function() {
	if(process.argv.length < 3)
		return false;

	if(process.argv[2] in commands) {
		if(process.argv[2] == "reload" && ! this.reload)
			return false;
		else
			return process.argv[2];
	}

	return false;
};

DaemonControl.prototype._help = function() {
	var self = this;
	var done = function(verbose) {
		if(! verbose)
			return;

		self._write(self._syntax() + "\n");
		self._write("help      prints this screen\n");
		self._write("status    checks id daemon is running\n");
		self._write("start     launches the daemon\n");
		self._write("stop      stops the daemon\n");
		self._write("restart   stops than starts the daemon\n");
		if(self.reload)
		self._write("reload    makes daemon to reload configuration\n");
	};

	if(this.hooks.help)
		return this.hooks.help(done);

	done(true);
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

	if(! this.options.hooks)
		this.hooks = {};
	else {
		this.hooks = this.options.hooks;
		if("object" != typeof this.hooks)
			throw new Error("DaemonControl: options.hooks is not an object");
	}

	for(var i in this.hooks) {
		if(! (i in commands))
			throw new Error("DaemonControl: unknow hook options.hooks." + i);

		if("function" != typeof this.hooks[i])
			throw new Error("DaemonControl: options.hooks." + i + " is not a function");
	}

	if(this.options.reload)
		this.reload = true;

	if("undefined" == typeof this.options.timeout)
		this.timeout = 5000;
	else {
		this.timeout = parseInt(this.options.timeout);

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

DaemonControl.prototype._main = function() {
	try {
		this._init();
	}
	catch(e) {
		return this.emit("error", e);
	}

	if(process.env.__daemon_control)
		return this.daemon();

	var cmd  = this._cmdline();
	var self = this;

	if(! cmd) {
		var done = function(verbose) {
			if(verbose)
				self._write(self._syntax());
		};

		if(this.options.syntax)
			return this.options.syntax(done);

		return done(true);
	}

	eval("this._" + cmd + "();");
};

DaemonControl.prototype._status = function(callback) {
	var self = this;
	var done = function(verbose, pid) {
		done = function(verbose, pid) {
			if(verbose) {
				if(! pid)
					self._write("Daemon is not running\n");
				else
					self._write("Daemon is running with pid: " + pid + "\n");
			}

			if(callback)
				callback(pid);
		};

		if(self.hooks.status)
			return self.hooks.status(done, pid);

		done(true, pid);
	};

	fs.readFile(this.filename, function(err, data) {
		if(err && err.code != "ENOENT")
			return self.emit("error", err);

		if(err)
			return done(true, null);

		var pid = parseInt(data);

		if(isNaN(pid))
			return done(true, null);

		try { process.kill(pid, 0); }
		catch(e) { return done(true, null); }

		done(true, pid);
	});
};

DaemonControl.prototype._syntax = function() {
	return "Usage:\nnode " + path.basename(process.argv[1]) + " {start|stop|restart|status|help" + (this.reload ? "|reload" : "") + "} [...]\n";
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
