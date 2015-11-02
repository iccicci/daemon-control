"use strict";

var dc = require(".."); // require("daemon-control");
var fs = require("fs");

var recover;
var notRunning;

var hooks = {
	argv: function(done, command, argv) {
		// let's pass to deamon only the command line arguments it is interested in
		var arr = [];

		for(var i in argv)
			switch(argv[i]) {
			case "-i":
				arr.push("-i");
				break;
			case "-n":
				notRunning = true;
				break;
			case "-r":
				recover = true;
				break;
			// unkonwn option cause a syntax error
			default:
				return done();
			}

		done(command, arr);
	},
	help: function(done) {
		hooks.syntax(function() {});

		console.log("Control parameter:");
		console.log("help      prints this screen");
		console.log("status    checks id daemon is running");
		console.log("start     launches the daemon");
		console.log("stop      stops the daemon");
		console.log("restart   stops than starts the daemon");
		console.log("reload    makes daemon to reload configuration");
		console.log("");
		console.log("Options:");
		console.log(" -i  Makes daemon to ignore SIGTERM (simulates a dead lock, infinite loop, etc)");
		console.log(" -n  Forces status to return not running (simulates daemon is not serving what is has to serve)");
		console.log(" -r  Requires a recovery procedure (simulates a previous deamon not clean exit, takes effect only if daemon is not running)");
		console.log("");

		done();
	},
	kill: function(done) {
		process.stdout.write(" Sending SIGKILL to Example");
		done(false);
	},
	reload: function(done, pid) {
		if(pid)
			console.log("Sending SIGHUP to Example");
		else
			console.log("Use start command to run Example");

		done(false);
	},
	running: function(done) {
		console.log("Stop Example before starting it, or use restart command");
		done(false);
	},
	start: function(done, child) {
		// always to check this in order to know if daemon was really started
		if(! child.pid)
			return console.log("Example not started");

		console.log("Example started with pid: " + child.pid);

		if(recover)
			// let's pipe daemon recovery procedure output to stdout
			child.stdio[3].pipe(process.stdout);

		done(false);
	},
	starting: function(done, options) {
		if(recover) {
			// let's add a pipe for daemon recovery procedure output: daemon should not use stdout
			options.stdio.push("pipe");
			// let's make daemon aware to run recovery procedure
			options.env.recover = "true";
		}

		console.log("Starting Example");
		done(false, options);
	},
	status: function(done, pid) {
		if(notRunning || ! pid) {
			console.log("Example is not running");

			return done(false, null);
		}

		console.log("Example is running with pid: " + pid);
		done(false, pid);
	},
	stop: function(done) {
		console.log("\nExample stopped");
		done(false);
	},
	syntax: function(done) {
		console.log("");
		console.log("Usage:");
		console.log("node complete.js {start|stop|restart|status|help|reload} [options]");
		console.log("");

		done(false);
	},
	term: function(done) {
		process.stdout.write("Sending SIGTERM to Example");
		done(false);
	},
	wait: function(done) {
		process.stdout.write(" #");
		done(false);
	},
};

var to;

function daemon(daemonized) {
	process.on("SIGHUP", function() {
		// deamon should never write to console, done just for example
		console.log("\n  configuration reloaded");
	});

	if(process.argv[2] == "-i")
		process.on("SIGTERM", function() {});

	if(process.env.recover) {
		// the pipe we added in starting hook
		var out = fs.createWriteStream(null, { fd: 3 });

		out.write("Recovering...\n");
		return setTimeout(function() {
			out.end("Recovered\n");
			main();
		}, 2000);
	}

	if(! daemonized)
		console.log("Running in console.");

	// do daemon stuff
	main();
}

function main() {
	to = setTimeout(function() {
		// deamon should never write to console, done just for example
		console.log("\n...still runnig with pid: " + process.pid);
		main();
	}, 20000);
}

dc(daemon, "daemon.pid", {
	hooks:   hooks,
	reload:  true,
	// inherit here should never be used: used just for example
	stdio:   ["ignore", "inherit", "inherit"],
	timeout: 3
}).on("error", function(err) {
	throw err;
});
