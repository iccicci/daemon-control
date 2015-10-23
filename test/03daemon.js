/* jshint mocha: true */
"use strict";

var assert   = require("assert");
var dc       = require("..");
var fs       = require("fs");
var helper   = require("./helper");
var events   = require("events");

describe("daemon", function() {
	describe("start error", function() {
		before(function(done) {
			var self = this;
			var node = process.argv[0];

			fs.unlink("daemon.pid", function() {
				self.dc = helper.dc(function() { process.argv[0] = node; setTimeout(done, 100); }, "daemon.pid");
				process.argv = ["none", "test", "start"];
			});
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.code, "ENOENT");
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is not running\nStarting daemon...\nDaemon not started\n");
		});
	});

	describe("start", function() {
		var pid;

		before(function(done) {
			var self = this;

			fs.unlink("daemon.pid", function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { start: function(cb, child) { pid = child.pid; cb(true); done(); } } });
				process.argv = [process.argv[0], "test/helper.js", "start"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is not running\nStarting daemon...\nDaemon started with pid: " + pid + "\n");
		});
	});

	describe("error writing pid file", function() {
		before(function(done) {
			this.dc = helper.dc(done, "none/test.pid");
			process.argv = [process.argv[0], "test/helper.js", "start"];
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.code, "ENOENT");
		});
	});

	describe("starting hook", function() {
		before(function(done) {
			var self = this;

			fs.unlink("daemon.pid", function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { starting: function(cb, options) { cb(false, options); done(); } } });
				process.argv = [process.argv[0], "test/helper.js", "start"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout.substr(0, 22), "Daemon is not running\n");
		});
	});

	describe("start hook", function() {
		before(function(done) {
			var self = this;
			var done2 = function() { console.log("2"); setTimeout(done, 500); };
			var done3 = function() { console.log("3"); setTimeout(done, 500); };
			var done4 = function() { console.log("4"); setTimeout(done, 500); };

			fs.unlink("daemon.pid", function() {
				self.dc = helper.dc(done2, "daemon.pid", { cwd: ".", env: {}, detached: true, hooks: {
					start: function(cb, child) { cb(false); done3(); }
				} });
				process.argv = [process.argv[0], "test/helper.js", "start"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is not running\nStarting daemon...\n");
		});
	});
});
