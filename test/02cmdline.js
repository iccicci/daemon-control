/* eslint-disable callback-return */
"use strict";

var assert   = require("assert");
var dc       = require("..");
var fs       = require("fs");
var helper   = require("./helper");
var events   = require("events");

describe("cmdline", function() {
	describe("missing parameter", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test");
			process.argv = [process.argv[0], "test"];
			process.nextTick(process.nextTick.bind(null, done));
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Usage:\nnode test {start|stop|restart|status|nodaemon|help} [...]\n");
		});
	});

	describe("wrong parameter", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test");
			process.argv = [process.argv[0], "test", "test"];
			process.nextTick(process.nextTick.bind(null, done));
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Usage:\nnode test {start|stop|restart|status|nodaemon|help} [...]\n");
		});
	});

	describe("reload parameter without reload option", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test");
			process.argv = [process.argv[0], "test", "reload"];
			process.nextTick(process.nextTick.bind(null, done));
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Usage:\nnode test {start|stop|restart|status|nodaemon|help} [...]\n");
		});
	});

	describe("syntax hook", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test", { hooks: { syntax: function(cb) { cb(false); done(); } } });
			process.argv = [process.argv[0], "test"];
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "");
		});
	});

	describe("argv hook", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test", { hooks: {
				argv:   function(cb, cmd, argv) { cb(); },
				syntax: function(cb) { cb(false); done(); }
			} });
			process.argv = [process.argv[0], "test", "help"];
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "");
		});
	});

	describe("wrong parameter (with reload)", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test", { reload: true });
			process.argv = [process.argv[0], "test", "test"];
			process.nextTick(process.nextTick.bind(null, done));
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Usage:\nnode test {start|stop|restart|status|nodaemon|help|reload} [...]\n");
		});
	});

	describe("help", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test");
			process.argv = [process.argv[0], "test", "help"];
			process.nextTick(process.nextTick.bind(null, done));
		});

		it("output", function() {
			assert.equal(this.dc.stdout.length, 298);
		});
	});

	describe("help (with reload)", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test", { reload: true });
			process.argv = [process.argv[0], "test", "help"];
			process.nextTick(process.nextTick.bind(null, done));
		});

		it("output", function() {
			assert.equal(this.dc.stdout.length, 352);
		});
	});

	describe("help hook", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test", { hooks: { help: function(cb) { cb(false); done(); } }});
			process.argv = [process.argv[0], "test", "help"];
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "");
		});
	});

	describe("status (missing pidfile)", function() {
		before(function(done) {
			var self = this;

			fs.unlink("daemon.pid", function() {
				self.dc = helper.dc(done, "daemon.pid");
				process.argv = [process.argv[0], "test", "status"];
				self.dc._write = function(msg) { self.dc.stdout = msg; done(); };
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is not running\n");
		});
	});

	describe("status (bad pidfile content)", function() {
		before(function(done) {
			var self = this;

			fs.writeFile("daemon.pid", "test", function() {
				self.dc = helper.dc(done, "daemon.pid");
				process.argv = [process.argv[0], "test", "status"];
				self.dc._write = function(msg) { self.dc.stdout = msg; done(); };
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is not running\n");
		});
	});

	describe("status (bad pid in pidfile)", function() {
		before(function(done) {
			var self = this;

			fs.writeFile("daemon.pid", "1000000000", function() {
				self.dc = helper.dc(done, "daemon.pid");
				process.argv = [process.argv[0], "test", "status"];
				self.dc._write = function(msg) { self.dc.stdout = msg; done(); };
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is not running\n");
		});
	});

	describe("status (running)", function() {
		before(function(done) {
			var self = this;

			fs.writeFile("daemon.pid", process.pid, function() {
				self.dc = helper.dc(done, "daemon.pid");
				process.argv = [process.argv[0], "test", "status"];
				self.dc._write = function(msg) { self.dc.stdout = msg; done(); };
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout.substr(0, 28), "Daemon is running with pid: ");
		});
	});

	describe("status hook (wrong pid)", function() {
		before(function(done) {
			var self = this;

			fs.writeFile("daemon.pid", 1000000000, function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { status: function(cb, pid) { cb(false); done(); }}});
				process.argv = [process.argv[0], "test", "status"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "");
		});
	});

	describe("status hook (running)", function() {
		before(function(done) {
			var self = this;

			fs.writeFile("daemon.pid", process.pid, function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { status: function(cb, pid) { self.pid = pid; cb(false, pid); done(); }}});
				process.argv = [process.argv[0], "test", "status"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "");
		});

		it("pid", function() {
			assert.equal(this.pid, process.pid);
		});
	});

	describe("start (running)", function() {
		before(function(done) {
			var self = this;

			fs.writeFile("daemon.pid", process.pid, function() {
				self.dc = helper.dc(done, "daemon.pid");
				self.dc.stdout = [];
				process.argv = [process.argv[0], "test", "start"];
				self.dc._write = function(msg) {
					self.dc.stdout.push(msg);

					if(self.dc.stdout.length === 2)
						done();
				};
			});
		});

		it("output 1", function() {
			assert.equal(this.dc.stdout[0].substr(0, 28), "Daemon is running with pid: ");
		});

		it("output 2", function() {
			assert.equal(this.dc.stdout[1], "Stop the daemon before starting it, or use restart command\n");
		});
	});

	describe("running hook", function() {
		before(function(done) {
			var self = this;

			fs.writeFile("daemon.pid", process.pid, function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { running: function(cb, pid) { self.pid = pid; cb(false); done(); }}});
				process.argv = [process.argv[0], "test", "start"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout.substr(0, 28), "Daemon is running with pid: ");
		});

		it("pid", function() {
			assert.equal(this.pid, process.pid);
		});
	});

	describe("reload (not running)", function() {
		before(function(done) {
			var self = this;

			fs.unlink("daemon.pid", function() {
				self.dc = helper.dc(done, "daemon.pid", { reload: true });
				self.dc.stdout = [];
				process.argv = [process.argv[0], "test", "reload"];
				self.dc._write = function(msg) {
					self.dc.stdout.push(msg);

					if(self.dc.stdout.length === 2)
						done();
				};
			});
		});

		it("output 1", function() {
			assert.equal(this.dc.stdout[0], "Daemon is not running\n");
		});

		it("output 2", function() {
			assert.equal(this.dc.stdout[1], "Use start command\n");
		});
	});

	describe("reload hook (not running)", function() {
		before(function(done) {
			var self = this;

			fs.unlink("daemon.pid", function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { reload: function(cb, pid) {
					cb(false);
					done();
				} }, reload: true });
				process.argv = [process.argv[0], "test", "reload"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is not running\n");
		});
	});

	describe("stop (not running)", function() {
		before(function(done) {
			var self = this;

			fs.unlink("daemon.pid", function() {
				self.dc = helper.dc(done, "daemon.pid");
				self.dc.stdout = [];
				process.argv = [process.argv[0], "test", "stop"];
				self.dc._write = function(msg) {
					self.dc.stdout = msg;
					done();
				};
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is not running\n");
		});
	});

	describe("nodaemon", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test", {}, done);
			process.argv = [process.argv[0], "test", "nodaemon"];
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Starting in console.\n");
		});
	});

	describe("nodaemon (with error)", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test", {}, function() { throw new Error("Test"); });
			process.argv = [process.argv[0], "test", "nodaemon"];
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "Test");
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Starting in console.\n");
		});
	});
});
