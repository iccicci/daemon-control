/*jslint evil: true */
"use strict";

var child_process = require("child_process");
var EventEmitter  = require("events");
var fs            = require("fs");
var path          = require("path");
var utils         = require("./utils");

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

var commands = utils.commands;
var hooks    = utils.hooks;

DaemonControl.prototype._init         = utils._init;
DaemonControl.prototype._init_options = utils._init_options;
DaemonControl.prototype._init_spawn   = utils._init_spawn;
DaemonControl.prototype._write        = utils._write;

DaemonControl.prototype._cmdline = function(callback) {
	if(process.argv.length < 3)
		return callback();

	if(! (process.argv[2] in commands))
		return callback();

	if(process.argv[2] === "reload" && ! this.reload)
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
		self._write("nodaemon  launches the application without detaching it from console\n");
		self._write("status    checks id daemon is running\n");
		self._write("start     launches the daemon\n");
		self._write("stop      stops the daemon\n");
		self._write("restart   stops than starts the daemon\n");
		if(self.reload)
		self._write("reload    makes daemon to reload configuration\n"); // eslint-disable-line indent
	};

	if(this.hooks.help)
		return this.hooks.help(done);

	done(true);
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
		return this.daemon(true);

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
		eval("self._" + cmd + "();"); // eslint-disable-line no-eval
	});
};

DaemonControl.prototype._nodaemon = function() {
	var self = this;

	process.nextTick(function() {
		try {
			self._write("Starting in console.\n");
			self.daemon(false);
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
					return callback(pid);
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
		if(err && err.code !== "ENOENT")
			return self.emit("error", err);

		if(err)
			return done(null);

		var pid = parseInt(data, 10);

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
			return callback();
	};

	if(self.hooks.stop)
		return self.hooks.stop(done);

	done(true);
};

DaemonControl.prototype._syntax = function() {
	return "Usage:\nnode " + path.basename(process.argv[1]) + " {start|stop|restart|status|nodaemon|help" + (this.reload ? "|reload" : "") + "} [...]\n";
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

			if(count === self.timeout && ! killed)
				return self._kill(pid, callback);

			self._wait(pid, callback, killed, count + 1);
		};

		if(self.hooks.wait)
			return self.hooks.wait(done);

		done(true);
	}, 1000);
};
