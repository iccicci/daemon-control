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
}

util.inherits(DaemonControl, EventEmitter);

module.exports = DaemonControl;

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
