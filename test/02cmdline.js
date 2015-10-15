/* jshint mocha: true */
"use strict";

var assert   = require("assert");
var dc       = require("..");
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
			this.dc = helper.dc(done, function() {}, "daemon.pid");
			process.argv = ["test", "test", "status"];
			process.nextTick(process.nextTick.bind(null, done));
		});

		it("output", function() {
			assert.equal(this.dc.stdout, "Daemon is not running\n");
		});
	});
});
