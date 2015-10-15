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
			this.dc = helper.dc(done);
		});

		it("error", function() {
			assert.equal(this.dc.ev.err.message, "DaemonControl: missing daemon parameter");
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
});
