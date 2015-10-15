/* jshint mocha: true */
"use strict";

var assert   = require("assert");
var fs       = require("fs");
var dc       = require("..");
var events   = require("events");

describe("dc", function() {
	describe("new", function() {
		before(function(done) {
			this.dc = new dc();
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
			this.dc = dc();
			done();
		});

		it("constructor", function() {
			assert.equal(this.dc instanceof dc, true);
		});

		it("emitter", function() {
			assert.equal(this.dc instanceof events.EventEmitter, true);
		});
	});
});
