"use strict";

var child_process = require("child_process");
var EventEmitter  = require("events");
var util          = require("util");

function DaemonControl(daemon, filename, options, timeout) {
	if(! (this instanceof DaemonControl))
		return new DaemonControl(daemon, filename, options, timeout);

	EventEmitter.call(this);

	this.daemon   = daemon;
	this.filename = filename;
	this.options  = options;
	this.timeout  = timeout;

	process.nextTick(this._doAll.bind(this));
}

util.inherits(DaemonControl, EventEmitter);

module.exports = DaemonControl;

DaemonControl.prototype._cmdline = function() {
};

DaemonControl.prototype._doAll = function() {
	try {
		this._init();
	}
	catch(e) {
		return this.emit("error", e);
	}

	if(process.env.__daemon_control)
		return this.daemon();

	this._cmdline();
};

DaemonControl.prototype._init = function() {
	if(! this.daemon)
		throw new Error("DaemonControl: missing daemon parameter");

	if("function" != typeof this.daemon)
		throw new Error("DaemonControl: daemon parameter is not a function");

	if(! this.filename)
		throw new Error("DaemonControl: missing filename parameter");

	if("string" != typeof this.filename)
		throw new Error("DaemonControl: filename parameter is not a string");

	if("undefined" == typeof this.options)
		this.options = {};
	else
		if("object" != typeof this.options)
			throw new Error("DaemonControl: options parameter is not an object");

	if("undefined" == typeof this.timeout)
		this.timeout = 5000;
	else {
		this.timeout = parseInt(this.timeout);

		if(isNaN(this.timeout))
			throw new Error("DaemonControl: timeout parameter is not an integer number");

		if(this.timeout <= 0)
			throw new Error("DaemonControl: timeout parameter is not a non zero positive integer number");
	}

	if(! ("cwd" in this.options))
		this.options.cwd = process.cwd;
	else
		if("string" != typeof this.options.cwd)
			throw new Error("DaemonControl: cwd option is not a string");

	if(! ("env" in this.options))
		this.options.cwd = process.env;
	else
		if("object" != typeof this.options.env)
			throw new Error("DaemonControl: env option is not an object");

	if(! ("stdio" in this.options))
		this.options.stdio = "ignore";

	if(! ("detached" in this.options))
		this.options.detached = true;
};
/*
function daemon(options) {

}


console.log(process.argv);

var child = child_process.spawn("/bin/basho", ["-c", "sleep 2"], {stdio:"inherit"});

console.log(child.pid);

child.on("error", function(err) {
	console.log(err);
});
child.unref();
console.log(typeof true);
*/
