# daemon-control

[![Build Status](https://travis-ci.org/iccicci/daemon-control.png)](https://travis-ci.org/iccicci/daemon-control)
[![Code Climate](https://codeclimate.com/github/iccicci/daemon-control/badges/gpa.svg)](https://codeclimate.com/github/iccicci/daemon-control)
[![Test Coverage](https://codeclimate.com/github/iccicci/daemon-control/badges/coverage.svg)](https://codeclimate.com/github/iccicci/daemon-control/coverage)
[![Donate](http://img.shields.io/bitcoin/donate.png?color=blue)](https://www.coinbase.com/cicci)

[![NPM version](https://badge.fury.io/js/daemon-control.svg)](https://www.npmjs.com/package/daemon-control)
[![bitHound Dependencies](https://www.bithound.io/github/iccicci/daemon-control/badges/dependencies.svg)](https://www.bithound.io/github/iccicci/daemon-control/master/dependencies/npm)
[![bitHound Dev Dependencies](https://www.bithound.io/github/iccicci/daemon-control/badges/devDependencies.svg)](https://www.bithound.io/github/iccicci/daemon-control/master/dependencies/npm)

This package offers an easy and quick to use tool to manage the _control script_ for a __daemon__ as
well a lot of ways to deeply configure _control script_ behaviour for each step.

### Usage

```javascript
var dc = require('daemon-control');

function daemon(daemonized) {
}

dc(daemon, 'daemon.pid');
```

```
$ node daemon.js {start|stop|restart|status|nodaemon|help[|reload]} [...]
```

A complete example can be found in
[sources @github](https://github.com/iccicci/daemon-control/blob/master/example/complete.js).

# Installation

With [npm](https://www.npmjs.com/package/daemon-control):
```sh
 $ npm install --save daemon-control
```

# API

```javascript
require('daemon-control');
```
Returns __DaemonControl__ _constructor_.

## Class: DaemonControl

Extends [events.EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter).
It manages the steps to control the __daemon__.

### Events

__Note:__ Events are emitted only on _control scrip_.

#### Event: 'error'

* err: {Error Object} the error.

Emitted when an error occurr.

### [new] DaemonControl(daemon, filename[, options])

Returns a new __DaemonControl__ _object_ to control the daemon, parses _command line arguments_ and tries to act as
requested by _command line_.

#### daemon(daemonized) {Function}

* daemonized: {Boolean} __true__ if lunched as a __daemon__ or __false__ if launched with __nodaemon__ command line
option.

The _daemon entry point_.

#### filename {String}

The path of the _pidfile_.

#### options {Object}

* cwd: {String} (default: __process.cwd()__) Proxied to __child_process.spawn__.
* detached: {Boolean} (default: __true__) Proxied to __child_process.spawn__.
* env: {Object} (default: __process.env__) Proxied to __child_process.spawn__.
* hooks: {Object} (default: __null__) Defines _hooks_ for each step of _control script_.
* reload: {Boolean} (default: __false__) Specifies if __reload command__ is enabled or not.
* timeout: {Integer} (default: __5__) Specifies __SIGKILL__ timeout.
* stdio: {Array|String} (default: __'ignore'__) Proxied to __child_process.spawn__.

If any other __option__ is present, it is proxied to [child_process.spawn]
(https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

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

#### argv(done, command, argv)

* done(command, argv): {Function} This is the special case where __done__ _Function_ does not accept a
__verbose__ parameter.
* command {String}: The __command__.
* argv {Array}: The rest of arguments in _command line_.

Called to parse _command line_. By default __done__ is called with __command__ and __argv__ passed to this
__hook__.

When _command line_ is parsed, __done__ must be called with the __command__ in input (or __null__ if a
syntax error is detected) and the __argv__ that will be passed to __daemon__ _command line_.

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
* options: {Object} the __options__ _Object_ prepared to call [child_process.spawn]
(https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

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

Called once per second while waiting for __deamon__ to exit after a __SIGTERM__ have been sent to it. Usefull to
customize the output to console of one dot per second.

## Command line parameters

```
$ node daemon.js {start|stop|restart|status|nodaemon|help[|reload]} [...]
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

A __status__ check is performed, if the __daemon__ is running the pakage sends it a __SIGHUP__.
If __reload option__ was __false__ when _constructor_ was called, this command is not enabled and it cause a
_syntax error_.

### nodaemon

The _Function_ __daemon__ is launched without running a daemon. Usefull during application development.

## Compatibility

This package is written following  __Node.js 4.2__ specifications always taking care about backward
compatibility. The package it tested under
[several Node.js versions](https://travis-ci.org/iccicci/daemon-control).

__Note:__ required __Node.js 0.11__.

__Note:__ tested only under __UNIX__.

## Licence

[MIT Licence](https://github.com/iccicci/daemon-control/blob/master/LICENSE)

## Bugs

Do not hesitate to report any bug or inconsistency [@github](https://github.com/iccicci/daemon-control/issues).

## ChangeLog

* 2017-02-07 - v0.1.5
  * Updated dependencies
* 2016-12-27 - v0.1.4
  * Updated dependencies
* 2015-11-02 - v0.1.3
  * Added _daemonized_ paramenter to __daemon__ _Function_.
* 2015-11-01 - v0.1.2
  * Added __nodaemon command__.
* 2015-10-24 - v0.1.1
  * Added complete example.
  * Added __argv hook__.
  * Fixed __syntax hook__.
  * Fixed __restart command__.
* 2015-10-23 - v0.1.0
  * First stable release
* 2015-10-18 - v0.0.2
  * Design pattern refactory
* 2015-10-15 - v0.0.1
  * Embryonal stage
