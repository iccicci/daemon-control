/* jshint mocha: true */
"use strict";

var assert   = require("assert");
var dc       = require("..");
var fs       = require("fs");
var helper   = require("./helper");
var events   = require("events");

describe("signals", function() {
	describe("start error", function() {
		before(function(done) {
			var self = this;
			var node = process.argv[0];

			fs.unlink("daemon.pid", function() {
				self.dc = helper.dc(function() { process.argv[0] = node; done(); }, "daemon.pid");
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
});
