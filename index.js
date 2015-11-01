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
	help:     null,
	nodaemon: null,
	reload:   null,
	restart:  null,
	start:    null,
	status:   null,
	stop:     null,
};

var hooks = {
	argv:     null,
	help:     null,
	kill:     null,
	reload:   null,
	running:  null,
	start:    null,
	starting: null,
	status:   null,
	stop:     null,
	syntax:   null,
	term:     null,
	wait:     null,
};

DaemonControl.prototype._cmdline = function(callback) {
	if(process.argv.length < 3)
		return callback();

	if(! (process.argv[2] in commands))
		return callback();

	if(process.argv[2] == "reload" && ! this.reload)
		return callback();

	if(this.hooks.argv)
		return this.hooks.argv(callback, process.argv[2], process.argv.slice(3));

	callback(process.argv[2], process.argv.slice(3));
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
	var i;

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
		delete this.options.hooks;

		if("object" != typeof this.hooks)
			throw new Error("DaemonControl: options.hooks is not an object");
	}

	for(i in this.hooks) {
		if(! (i in hooks))
			throw new Error("DaemonControl: unknow hook options.hooks." + i);

		if("function" != typeof this.hooks[i])
			throw new Error("DaemonControl: options.hooks." + i + " is not a function");
	}

	if("reload" in this.options) {
		this.reload = this.options.reload;
		delete this.options.reload;
	}

	if("timeout" in this.options) {
		this.timeout = parseInt(this.options.timeout);
		delete this.options.timeout;

		if(isNaN(this.timeout))
			throw new Error("DaemonControl: timeout parameter is not an integer number");

		if(this.timeout <= 0)
			throw new Error("DaemonControl: timeout parameter is not a non zero positive integer number");
	}
	else
		this.timeout = 5;

	if(! ("cwd" in this.options))
		this.options.cwd = process.cwd();
	else
		if("string" != typeof this.options.cwd)
			throw new Error("DaemonControl: cwd option is not a string");

	if(! ("env" in this.options)) {
		this.options.env = {};

		for(i in process.env)
			this.options.env[i] = process.env[i];
	}
	else
		if("object" != typeof this.options.env)
			throw new Error("DaemonControl: env option is not an object");

	if(! ("stdio" in this.options))
		this.options.stdio = "ignore";

	if(! ("detached" in this.options))
		this.options.detached = true;
};

DaemonControl.prototype._kill = function(pid, callback) {
	var self = this;
	var done = function(verbose) {
		if(verbose)
			self._write("Sending SIGKILL to daemon.");

		process.kill(pid, "SIGKILL");
		self._wait(pid, callback, true);
	};

	if(self.hooks.kill)
		return self.hooks.kill(done, pid);

	done(true);
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

	var self = this;

	this._cmdline(function(cmd, argv) {
		if(! cmd) {
			var done = function(verbose) {
				if(verbose)
					self._write(self._syntax());
			};

			if(self.hooks.syntax)
				return self.hooks.syntax(done);

			return done(true);
		}

		self.argv = argv;
		eval("self._" + cmd + "();");
	});
};

DaemonControl.prototype._nodaemon = function() {
	var self = this;

	process.nextTick(function() {
		try {
			self._write("Starting in console.\n");
			self.daemon();
		}
		catch(e) {
			self.emit("error", e);
		}
	});
};

DaemonControl.prototype._reload = function() {
	var self = this;

	this._status(function(pid) {
		var done = function(verbose) {
			if(pid)
				process.kill(pid, "SIGHUP");

			if(! verbose)
				return;

			if(pid)
				return self._write("Sending SIGHUP to daemon.\n");

			self._write("Use start command\n");
		};

		if(self.hooks.reload)
			return self.hooks.reload(done, pid);

		done(true);
	});
};

DaemonControl.prototype._restart = function() {
	this._stop(this._start.bind(this, true));
};

DaemonControl.prototype._start = function(checked) {
	var self = this;
	var done = function(pid) {
		if(pid) {
			done = function(verbose) {
				if(verbose)
					self._write("Stop the daemon before starting it, or use restart command\n");
			};

			if(self.hooks.running)
				return self.hooks.running(done, pid);

			done(true);
		}
		else {
			done = function(verbose, options) {
				var child;

				done = function(verbose) {
					if(! verbose)
						return;

					if(child.pid)
						self._write("Daemon started with pid: " + child.pid + "\n");
					else
						self._write("Daemon not started\n");
				};

				if(verbose)
					self._write("Starting daemon...\n");

				options.env.__daemon_control = "true";
				self.argv.unshift(process.argv[1]);
				child = child_process.spawn(process.argv[0], self.argv, options);
				child.on("error", self.emit.bind(self, "error"));
				child.unref();

				fs.writeFile(self.filename, child.pid, function(err) {
					if(err)
						self.emit("error", err);

					if(self.hooks.start)
						return self.hooks.start(done, child);

					done(true);
				});
			};

			if(self.hooks.starting)
				return self.hooks.starting(done, self.options);

			done(true, self.options);
		}
	};

	if(checked)
		return done(null);

	this._status(done);
};

DaemonControl.prototype._status = function(callback) {
	var self = this;
	var done = function(pid) {
		done = function() {
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

		if(pid)
			return done();

		fs.unlink(self.filename, done);
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

DaemonControl.prototype._stop = function(callback) {
	var self = this;

	this._status(function(pid) {
		if(! pid) {
			if(! callback)
				return;

			return callback();
		}

		var done = function(verbose) {
			if(verbose)
				self._write("Sending SIGTERM to daemon.");

			process.kill(pid, "SIGTERM");
			self._wait(pid, callback);
		};

		if(self.hooks.term)
			return self.hooks.term(done);

		done(true);
	});
};

DaemonControl.prototype._stopped = function(callback) {
	var self = this;

	var done = function(verbose) {
		if(verbose)
			self._write("\nDaemon stopped\n");

		if(callback)
			callback();
	};

	if(self.hooks.stop)
		return self.hooks.stop(done);

	done(true);
};

DaemonControl.prototype._syntax = function() {
	return "Usage:\nnode " + path.basename(process.argv[1]) + " {start|stop|restart|status|help" + (this.reload ? "|reload" : "") + "} [...]\n";
};

DaemonControl.prototype._wait = function(pid, callback, killed, count) {
	var self = this;

	if(! count)
		count = 1;

	setTimeout(function() {
		var done = function(verbose) {
			if(verbose)
				self._write(".");

			try { process.kill(pid, 0); }
			catch(e) {
				return self._stopped(callback);
			}

			if(count == self.timeout && ! killed)
				return self._kill(pid, callback);

			self._wait(pid, callback, killed, count + 1);
		};

		if(self.hooks.wait)
			return self.hooks.wait(done);

		done(true);
	}, 1000);
};

DaemonControl.prototype._write = function(msg) {
	process.stdout.write(msg);
};
