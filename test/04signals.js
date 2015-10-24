/* jshint mocha: true */
"use strict";

var assert   = require("assert");
var dc       = require("..");
var fs       = require("fs");
var helper   = require("./helper");
var events   = require("events");

describe("signals", function() {
	describe("reload", function() {
		before(function(done) {
			var self = this;

			helper.dcd(done, this, "wait", function() {
				self.dc = helper.dc(done, "daemon.pid", { reload: true });
				process.argv = [process.argv[0], "test/helper.js", "reload"];
				helper.wait(self.pid, done);
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGHUP to daemon.\n");
		});
	});

	describe("stop", function() {
		before(function(done) {
			var self = this;

			helper.dcd(done, this, "wait", function() {
				self.dc = helper.dc(done, "daemon.pid");
				process.argv = [process.argv[0], "test/helper.js", "stop"];
				helper.wait(self.pid, done);
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGTERM to daemon.");
		});
	});

	describe("restart (running)", function() {
		before(function(done) {
			var self = this;

			helper.dcd(done, this, "wait", function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { start: function(cb, child) {
					self.pid2 = child.pid;
					cb(true);
					helper.wait(self.pid2, done);
				} } });
				process.argv = [process.argv[0], "test/helper.js", "restart"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGTERM to daemon..\n" +
				"Daemon stopped\nStarting daemon...\nDaemon started with pid: " + this.pid2 + "\n");
		});
	});

	describe("stop (1 sec delay)", function() {
		before(function(done) {
			var self = this;

			helper.dcd(done, this, "delay", function() {
				self.dc = helper.dc(done, "daemon.pid");
				process.argv = [process.argv[0], "test/helper.js", "stop"];
				helper.wait(self.pid, done);
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGTERM to daemon..");
		});
	});

	describe("kill", function() {
		this.timeout(3000);

		before(function(done) {
			var self = this;

			helper.dcd(done, this, "delay", function() {
				self.dc = helper.dc(done, "daemon.pid", { timeout: 1 });
				process.argv = [process.argv[0], "test/helper.js", "stop"];
				helper.wait(self.pid, done);
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGTERM to daemon..Sending SIGKILL to daemon.");
		});
	});

	describe("term hook", function() {
		before(function(done) {
			var self = this;

			helper.dcd(done, this, "wait", function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { term: function(cb) { cb(false); self.called = true; } } });
				process.argv = [process.argv[0], "test/helper.js", "stop"];
				helper.wait(self.pid, done);
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\n");
		});

		it("called", function() {
			assert.equal(this.called, true);
		});
	});

	describe("wait hook", function() {
		before(function(done) {
			var self = this;

			helper.dcd(done, this, "delay", function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { wait: function(cb) { cb(false); self.called = true; } } });
				process.argv = [process.argv[0], "test/helper.js", "stop"];
				helper.wait(self.pid, done);
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGTERM to daemon.");
		});

		it("called", function() {
			assert.equal(this.called, true);
		});
	});

	describe("kill hook", function() {
		before(function(done) {
			var self = this;

			helper.dcd(done, this, "delay", function() {
				self.dc = helper.dc(done, "daemon.pid", { timeout: 1, hooks: { kill: function(cb) { cb(false); self.called = true; } } });
				process.argv = [process.argv[0], "test/helper.js", "stop"];
				helper.wait(self.pid, done);
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGTERM to daemon..");
		});

		it("called", function() {
			assert.equal(this.called, true);
		});
	});

	describe("stop hook", function() {
		before(function(done) {
			var self = this;

			helper.dcd(done, this, "wait", function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { stop: function(cb) { cb(false); done(); } } });
				process.argv = [process.argv[0], "test/helper.js", "stop"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGTERM to daemon..");
		});
	});

	describe("stop complete output", function() {
		before(function(done) {
			var self = this;

			helper.dcd(done, this, "wait", function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { stop: function(cb) { cb(true); done(); } } });
				process.argv = [process.argv[0], "test/helper.js", "stop"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGTERM to daemon..\nDaemon stopped\n");
		});
	});
});
