/* jshint mocha: true */
"use strict";

var assert   = require("assert");
var dc       = require("..");
var fs       = require("fs");
var helper   = require("./helper");
var events   = require("events");

describe("cmdline", function() {
	describe("missing parameter", function() {
		before(function(done) {
			this.dc = helper.dc(done, function() {}, "test");
			process.argv = ["test", "test"];
			process.nextTick(process.nextTick.bind(null, done));
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Usage:\nnode test {start|stop|restart|status|help} [...]\n");
		});
	});

	describe("wrong parameter", function() {
		before(function(done) {
			this.dc = helper.dc(done, function() {}, "test");
			process.argv = ["test", "test", "test"];
			process.nextTick(process.nextTick.bind(null, done));
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Usage:\nnode test {start|stop|restart|status|help} [...]\n");
		});
	});

	describe("syntax listener", function() {
		before(function(done) {
			this.dc = helper.dc(done, function() {}, "test");
			this.dc.on("syntax", done);
			process.argv = ["test", "test"];
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "");
		});
	});

	describe("help", function() {
		before(function(done) {
			this.dc = helper.dc(done, function() {}, "test");
			process.argv = ["test", "test", "help"];
			process.nextTick(process.nextTick.bind(null, done));
		});

		it("output", function() {
			assert.equal(this.dc.stdout.length, 220);
		});
	});

	describe("help listener", function() {
		before(function(done) {
			this.dc = helper.dc(done, function() {}, "test");
			this.dc.on("help", done);
			process.argv = ["test", "test", "help"];
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "");
		});
	});

	describe("status (missing pidfile)", function() {
		before(function(done) {
			var self = this;

			fs.unlink("daemon.pid", function() {
				self.dc = helper.dc(done, function() {}, "daemon.pid");
				process.argv = ["test", "test", "status"];
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
				self.dc = helper.dc(done, function() {}, "daemon.pid");
				process.argv = ["test", "test", "status"];
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
				self.dc = helper.dc(done, function() {}, "daemon.pid");
				process.argv = ["test", "test", "status"];
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
				self.dc = helper.dc(done, function() {}, "daemon.pid");
				process.argv = ["test", "test", "status"];
				self.dc._write = function(msg) { self.dc.stdout = msg; done(); };
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout.substr(0, 28), "Daemon is running with pid: ");
		});
	});

	describe("status listener (wrong pid)", function() {
		before(function(done) {
			var self = this;

			fs.writeFile("daemon.pid", 1000000000, function() {
				self.dc = helper.dc(done, function() {}, "daemon.pid");
				self.dc.on("status", function(pid, done2) {
					self.done = done2;
					done();
				});
				process.argv = ["test", "test", "status"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "");
		});

		it("done", function() {
			assert.equal(this.dc.done, null);
		});
	});

	xdescribe("status listener (running)", function() {
		before(function(done) {
			var self = this;

			fs.writeFile("daemon.pid", 1000000000, function() {
				self.dc = helper.dc(done, function() {}, "daemon.pid");
				self.dc.on("status", function(pid, done2) {
					done();
					done2();
				});
				process.argv = ["test", "test", "status"];
			});
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "");
		});
	});
});
