/* jshint mocha: true */
"use strict";

var assert   = require("assert");
var dc       = require("..");
var helper   = require("./helper");
var events   = require("events");

describe("dc", function() {
	describe("new", function() {
		before(function(done) {
			this.dc = new dc(function() {}, "test");
			this.dc._write("");
			this.dc._write = function() {};
			done();
		});

		it("constructor", function() {
			assert.equal(this.dc instanceof dc, true);
		});

		it("emitter", function() {
			assert.equal(this.dc instanceof events.EventEmitter, true);
		});
	});

	describe("without new", function() {
		before(function(done) {
			this.dc = dc(function() {}, "test");
			this.dc._write = function() {};
			done();
		});

		it("constructor", function() {
			assert.equal(this.dc instanceof dc, true);
		});

		it("emitter", function() {
			assert.equal(this.dc instanceof events.EventEmitter, true);
		});
	});

	describe("missing daemon", function() {
		before(function(done) {
			var self = this;

			this.dc = dc();
			this.dc.on("error", function(err) {
				self.err = err;
				done();
			});
		});

		it("error", function() {
			assert.equal(this.err.message, "DaemonControl: missing daemon parameter");
		});
	});

	describe("wrong daemon", function() {
		before(function(done) {
			this.dc = helper.dc(done, "test");
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: daemon parameter is not a function");
		});
	});

	describe("missing filename", function() {
		before(function(done) {
			this.dc = helper.dc(done, null);
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: missing filename parameter");
		});
	});

	describe("wrong filename", function() {
		before(function(done) {
			this.dc = helper.dc(done, null, {});
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: filename parameter is not a string");
		});
	});

	describe("wrong options", function() {
		before(function(done) {
			this.dc = helper.dc(done, null, "test", "test");
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: options parameter is not an object");
		});
	});

	describe("wrong hooks", function() {
		before(function(done) {
			this.dc = helper.dc(done, null, "test", { hooks: "test" });
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: options.hooks is not an object");
		});
	});

	describe("wrong hook", function() {
		before(function(done) {
			this.dc = helper.dc(done, null, "test", { hooks: { start: "test" }});
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: options.hooks.start is not a function");
		});
	});

	describe("unknown hook", function() {
		before(function(done) {
			this.dc = helper.dc(done, null, "test", { hooks: { test: null }});
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: unknow hook options.hooks.test");
		});
	});

	describe("wrong timeout", function() {
		before(function(done) {
			this.dc = helper.dc(done, null, "test", { timeout: "test" });
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: timeout parameter is not an integer number");
		});
	});

	describe("negative timeout", function() {
		before(function(done) {
			this.dc = helper.dc(done, null, "test", { timeout: 0 });
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: timeout parameter is not a non zero positive integer number");
		});
	});

	describe("wrong cwd", function() {
		before(function(done) {
			this.dc = helper.dc(done, null, "test", { cwd: {} });
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: cwd option is not a string");
		});
	});

	describe("wrong env", function() {
		before(function(done) {
			this.dc = helper.dc(done, null, "test", { env: true });
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: env option is not an object");
		});
	});

	describe("wrong pidfile", function() {
		before(function(done) {
			this.dc = helper.dc(done, null, "test");
			process.argv = ["test", "test", "status"];
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.code, "EISDIR");
		});
	});
});
