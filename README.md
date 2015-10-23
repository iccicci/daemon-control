# daemon-control

[![Build Status](https://travis-ci.org/iccicci/daemon-control.png)](https://travis-ci.org/iccicci/daemon-control)
[![Code Climate](https://codeclimate.com/github/iccicci/daemon-control/badges/gpa.svg)](https://codeclimate.com/github/iccicci/daemon-control)
[![Test Coverage](https://codeclimate.com/github/iccicci/daemon-control/badges/coverage.svg)](https://codeclimate.com/github/iccicci/daemon-control/coverage)
[![Donate](http://img.shields.io/bitcoin/donate.png?color=red)](https://www.coinbase.com/cicci)

[![dependency status](https://david-dm.org/iccicci/daemon-control.svg)](https://david-dm.org/iccicci/daemon-control#info=dependencies)
[![dev dependency status](https://david-dm.org/iccicci/daemon-control/dev-status.svg)](https://david-dm.org/iccicci/daemon-control#info=devDependencies)

This package offers an easy and quick to use tool to manage the _control script_ for a __daemon__ as
well a lot of ways to deeply configure _control script_ behaviour for each step.

### Usage

```javascript
var dc = require('daemon-control');

function daemon() {
}

dc(daemon, 'daemon.pid');
```

```
$ node daemon.js {start|stop|restart|status|help[|reload]} [...]
```

# Installation

With [npm](https://www.npmjs.com/package/daemon-control):
```sh
npm install daemon-control
```

# API

```javascript
require('daemon-control');
```
Returns __DaemonControl__ _constructor_.

## Class: DaemonControl

Extends [events.EventEmitter](https://nodejs.org/api/events.html#events_class_events_eventemitter).
It manages the steps to control the __daemon__.

### Events

__Note:__ Events are emitted only on _control scrip_.

#### Event: 'error'

* err: {Error Object} the error.

Emitted when an error occurr.

### [new] DaemonControl(daemon, filename[, options])

Returns a new __DaemonControl__ to control the daemon, parses _command line arguments_ and try to act as requested
by _command line_.

#### daemon {Function}

The daemon entry point.

#### filename {String}

The path of the _pidfile_.

#### options {Object}

* cwd: {String} (default: __process.cwd()__) Proxied to __child_process.spawn__.
* detached: {Boolean} (default: __true__) Proxied to __child_process.spawn__.
* env: {Object} (default: __process.env__) Proxied to __child_process.spawn__.
* hooks: {Object} (default: __null__) Defines _hooks_ for each step of _control script_.
* reload: {Boolean} (default: __false__) Specifies if __reload__ parameter is enabled or not.
* timeout: {Integer} (default: __5__) Specifies __SIGKILL__ timeout.
* stdio: {Array|String} (default: __'ignore'__) Proxied to __child_process.spawn__.

If any other __option__ is present, it is proxied to
[child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

##### hooks:

If not specified _control script_ acts with its default behaviour. Can be used to customized one or more steps.
Each _hook_ is a _Function_ which accept a __done__ _Function_ as first parameter which must be called at the
end of the customized _hook_.

_Functions_ __done__ accept a _Boolean_ __verbose__ parameter as first parameter, if set to __true__ default
messages are printed to console, otherwise the _hook_ can print custom messages to console and call __done__
with __verbose__ parameter set to __false__.

##### reload:

If __true__ the __reload__ _command line parameter_ will be enabled. This means the __deamon__ must be aware it
can receive a __SIGHUP__.

##### timeout:

The timeout (in seconds) before sending __SIGKILL__ to __daemon__, if __SIGTERM__ is not enough to stop it.

### Hooks

#### syntax(done)

* done(verbose): {Function}

Called when there is _syntax error_ in _command line_.

#### help(done)

* done(verbose): {Function}

Called when __help__ is requested from _command line_.

#### status(done, pid)

* done(verbose, pid): {Function}
* pid: {Integer} the __pid__ of the __deamon__ or __null__ if __daemon__ is not running.

Called when a __status__ check is performed. Can be used to perform deeper checks on __daemon__ to discover
if it is running correctly. If accordingly to these checks the __daemon__ is not running, __done__ must be
called with __pid__ parameter set to __null__, otherwise with the value passed to the _hook_.

#### term(done)

* done(verbose): {Function}

Called before sending __SIGTERM__ to __daemon__.
This _hook_ is not called if __daemon__ is not running.

#### kill(done)

* done(verbose): {Function}

Called before sending __SIGKILL__ to __daemon__.
This _hook_ is not called if __SIGTERM__ was enough to stop the __daemon__.

#### stop(done)

* done(verbose): {Function}

Called after __daemon__ is stopped.

#### starting(done, options)

* done(verbose, options): {Function}
* options: {Object} the __options__ _Object_ prepared to call
[child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

Called before __daemon__ launch attempt. This is the latest occasion to customize the __options__ _Object_ (if this is
required) before passing it to __done__ _Function_.

#### start(done, child)

* done(verbose): {Function}
* child: {Object} the [ChildProcess](https://nodejs.org/api/child_process.html#child_process_class_childprocess)
_Object_ returned by
[child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

Called after __daemon__ launch attempt. This is called reguardless if __daemon__ was started correctly or not in order
to give access to the [ChildProcess](https://nodejs.org/api/child_process.html#child_process_class_childprocess)
_Object_.

#### running(done, pid)

* done(verbose): {Function}
* pid: {Integer} the __pid__ of the __deamon__.

Called when __start__ is requested from command line and the __daemon__ is already running.

#### reload(done, pid)

* done(verbose): {Function}
* pid: {Integer} the __pid__ of the __deamon__ or __null__ if __daemon__ is not running.

Called before sending __SIGHUP__ to __daemon__. If Pid is __null__ this _hook_ has just to print an error message to
console.

#### wait(done)

* done(verbose): {Function}

Called once per second while waiting for __deamon__ to exit after a __SIGTERM__ have been sent to it. Useull to customize
the output to console of one dot per second.

## Command line parameters

```
$ node daemon.js {start|stop|restart|status|help[|reload]} [...]
```

The first parameter is consumed by _control script_, from second one to last one (if present) they are passed to the
__daemon__.

### status

The package checks for the _pidfile_, if it exists its content is read and if it is an _Integer_ the package checks for
process with that _pid_; if this process exists the __daemon__ is running.

### start

A __status__ check is performet, if the __daemon__ is not running the pakage tries to lauch it.

### stop

A __status__ check is performed, if the __daemon__ is running the pakage tries to stop it.

### restart

A __status__ check is performed, if the __daemon__ is running the pakage tries to stop it.
Once this process is completed, the package tries to launch the __daemon__.

### help

The _help message_ is printed to console.

### reload

A __status__ check is performed, if the __daemon__ is running the pakage send it a __SIGHUP__.
If __reload option__ was __false__ when _constructor_ was called, this command is not enabled and it cause a
_syntax error_.

## Complex example

```javascript
var dc = require('daemon-control');
var fs = require('fs');

function checks() {
  // performs custm checks and returns checks result
}

var recover;

function status(done, pid) {
  if(! pid) {
    console.log('Daemon is not running');

    return done(false);
  }

  if(checks()) {
    console.log('Daemon is running with pid: ' + pid);

    return done(false, pid);
  }

  recover = true;
  console.log('Daemon is not running');
  done(false);
});

function kill(done) {
  // a SIGKILL was required, let's do recovery procedure
  recover = true;
  done(true);
});

function starting(done, options) {
  if(recover) {
    // let's set this to instruct daemon to run recovery procedure
    options.env.recover = true;
    // let's add a pipe for recovery procedure output
    options.stdio = ['ignore', 'ignore', 'ignore', 'pipe'];
  }

  done(true, options);
});

function start(done, child) {
  if(child.pid && recover)
    // let's print recovery procedure output to console
    child.stdio[3].pipe(process.stdout);

  done(true);
});

function daemon() {
  if(process.env.recover) {
     // the pipe we added in starting hook
    var out = fs.createWriteStream(3);

    out.write("Recovering...\n");
    // perform recovery procedure
    out.end("Recovered\n");
  }

  // do daemon stuff
}

var hooks = {
  kill:     kill,
  start:    start,
  starting: starting,
  status:   status
};

dc(daemon, 'daemon.pid', { hooks: hooks }).on('error', function(err) {
  throw err;
});
```

### Compatibility

This package is written following  __Node.js 4.2__ specifications always taking care about backward
compatibility. The package it tested under following versions:
* 4.2
* 4.1
* 4.0
* 0.12
* 0.11

__Note:__ required __Node.js 0.11__.

__Note:__ tested only under __UNIX__.

### Licence

[MIT Licence](https://github.com/iccicci/daemon-control/blob/master/LICENSE)

### Bugs

Do not hesitate to report any bug or inconsistency [@github](https://github.com/iccicci/daemon-control/issues).

### ChangeLog

* 2015-10-23 - v0.1.0
  * First stable release
* 2015-10-18 - v0.0.2
  * Design pattern refactory
* 2015-10-15 - v0.0.1
  * Embryonal stage
