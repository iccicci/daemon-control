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
	this.options  = options || {};
	this.timeout  = timeout || 5000;

	process.nextTick(this._doAll.bind(this));
}

util.inherits(DaemonControl, EventEmitter);

module.exports = DaemonControl;

DaemonControl.prototype._doAll = function() {
	try {
		this._init();
	}
	catch(e) {
		return this.emit("error", e);
	}
};

DaemonControl.prototype._init = function() {
	if(! this.daemon)
		throw new Error("DaemonControl: missing daemon parameter");
	if("function" != typeof this.daemon)
		throw new Error("DaemonControl: daemon parameter is not a function");
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
