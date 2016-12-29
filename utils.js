"use strict";

var commands = {
	help:     null,
	nodaemon: null,
	reload:   null,
	restart:  null,
	start:    null,
	status:   null,
	stop:     null,
};

var hooks = {
	argv:     null,
	help:     null,
	kill:     null,
	reload:   null,
	running:  null,
	start:    null,
	starting: null,
	status:   null,
	stop:     null,
	syntax:   null,
	term:     null,
	wait:     null,
};

function _init() {
	if(! this.daemon)
		throw new Error("DaemonControl: missing daemon parameter");

	if("function" !== typeof this.daemon)
		throw new Error("DaemonControl: daemon parameter is not a function");

	if(! this.filename)
		throw new Error("DaemonControl: missing filename parameter");

	if("string" !== typeof this.filename)
		throw new Error("DaemonControl: filename parameter is not a string");

	if("undefined" === typeof this.options)
		this.options = {};
	else
		if("object" !== typeof this.options)
			throw new Error("DaemonControl: options parameter is not an object");

	this._init_options();
}

function _init_options() {
	var i;

	if(! this.options.hooks)
		this.hooks = {};
	else {
		this.hooks = this.options.hooks;
		delete this.options.hooks;

		if("object" !== typeof this.hooks)
			throw new Error("DaemonControl: options.hooks is not an object");
	}

	for(i in this.hooks) {
		if(! (i in hooks))
			throw new Error("DaemonControl: unknow hook options.hooks." + i);

		if("function" !== typeof this.hooks[i])
			throw new Error("DaemonControl: options.hooks." + i + " is not a function");
	}

	if("reload" in this.options) {
		this.reload = this.options.reload;
		delete this.options.reload;
	}

	if("timeout" in this.options) {
		this.timeout = parseInt(this.options.timeout, 10);
		delete this.options.timeout;

		if(isNaN(this.timeout))
			throw new Error("DaemonControl: timeout parameter is not an integer number");

		if(this.timeout <= 0)
			throw new Error("DaemonControl: timeout parameter is not a non zero positive integer number");
	}
	else
		this.timeout = 5;

	this._init_spawn();
}

function _init_spawn() {
	var i;

	if(! ("cwd" in this.options))
		this.options.cwd = process.cwd();
	else
		if("string" !== typeof this.options.cwd)
			throw new Error("DaemonControl: cwd option is not a string");

	if(! ("env" in this.options)) {
		this.options.env = {};

		for(i in process.env)
			this.options.env[i] = process.env[i];
	}
	else
		if("object" !== typeof this.options.env)
			throw new Error("DaemonControl: env option is not an object");

	if(! ("stdio" in this.options))
		this.options.stdio = "ignore";

	if(! ("detached" in this.options))
		this.options.detached = true;
}

function _write(msg) {
	process.stdout.write(msg);
}

module.exports = {
	_init:         _init,
	_init_options: _init_options,
	_init_spawn:   _init_spawn,
	_write:        _write,
	commands:      commands,
	hooks:         hooks,
};
