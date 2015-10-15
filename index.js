"use strict";

var child_process = require("child_process");
var EventEmitter  = require("events");
var util          = require("util");

function DaemonControl() {
	EventEmitter.call(this);
}

util.inherits(DaemonControl, EventEmitter);

function daemon(options) {

}

module.exports = {
	control: new DaemonControl(),
	daemon:  daemon
};

console.log(process.argv);

var child = child_process.spawn("/bin/basho", ["-c", "sleep 2"], {stdio:"inherit"});

console.log(child.pid);

child.on("error", function(err) {
	console.log(err);
});
child.unref();
console.log(typeof true);
