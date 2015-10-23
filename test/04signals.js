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
				self.dc = helper.dc(done, "daemon.pid", { reload: true, hooks: { reload: function(cb, pid) {
					cb(true);
					helper.wait(pid, done);
				} } });
				process.argv = [process.argv[0], "test/helper.js", "reload"];
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
				self.dc = helper.dc(done, "daemon.pid", { hooks: { term: function(cb, pid) {
					cb(true);
					helper.wait(pid, done);
				} } });
				process.argv = [process.argv[0], "test/helper.js", "stop"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGTERM to daemon.");
		});
	});

	describe("stop (1 sec delay)", function() {
		before(function(done) {
			var self = this;

			helper.dcd(done, this, "delay", function() {
				self.dc = helper.dc(done, "daemon.pid", { hooks: { term: function(cb, pid) {
					cb(true);
					helper.wait(pid, done);
				} } });
				process.argv = [process.argv[0], "test/helper.js", "stop"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is running with pid: " + this.pid + "\nSending SIGTERM to daemon..");
		});
	});
});
