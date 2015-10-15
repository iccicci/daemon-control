# daemon-control

[![Build Status](https://travis-ci.org/iccicci/daemon-control.png)](https://travis-ci.org/iccicci/daemon-control)
[![Code Climate](https://codeclimate.com/github/iccicci/daemon-control/badges/gpa.svg)](https://codeclimate.com/github/iccicci/daemon-control)
[![Test Coverage](https://codeclimate.com/github/iccicci/daemon-control/badges/coverage.svg)](https://codeclimate.com/github/iccicci/daemon-control/coverage)
[![Donate](http://img.shields.io/bitcoin/donate.png?color=red)](https://www.coinbase.com/cicci)

[![dependency status](https://david-dm.org/iccicci/daemon-control.svg)](https://david-dm.org/iccicci/daemon-control#info=dependencies)
[![dev dependency status](https://david-dm.org/iccicci/daemon-control/dev-status.svg)](https://david-dm.org/iccicci/daemon-control#info=devDependencies)

[![NPM](https://nodei.co/npm/daemon-control.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/daemon-control/)

### Usage

```javascript
var dc = require('daemon-control');

// this code is executed both in daemon and control script

function daemon() {
    // this code is executed in daemon only
}

dc(daemon, 'daemon.pid');
```

```
$ node daemon.js {start|stop|restart|status|help} [...]
```

### Installation

With [npm](https://www.npmjs.com/package/daemon-control):
```sh
npm install daemon-control
```

# Under development

This package is currently under development and __it does not__ what this readme says.

# API

```javascript
require('daemon-control');
```
Returns __DaemonControl__ constructor.

## Class: DaemonControl

Extends [events.EventEmitter](https://nodejs.org/api/events.html#events_class_events_eventemitter).

### Events

__Note:__ Events are emitted only on _control scrip_.

#### Event: 'error'

* err: {Error Object} the error.

Emitted when an error occurr.

#### Event: 'start'

* options: {Object} the __options__ _Object_ was passed to the constructor, plus default values.
* done: {Function}: the function to call to inform __DaemonControl__ to proceed with __daemon__ launch attempt.

Emitted before __daemon__ launch attempt. This is the latest occasion to customize the __options__ _Object_ if this is
required.

#### Event: 'started'

* child_process: {Object} the [ChildProcess](https://nodejs.org/api/child_process.html#child_process_class_childprocess)
object returned by
[child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

Emitted after __daemon__ launch attempt. This is emitted reguardless if __daemon__ was started correctly or not in order
to give access to the [ChildProcess](https://nodejs.org/api/child_process.html#child_process_class_childprocess) object.

#### Event: 'term'

Emitted before sending __SIGTERM__ to __daemon__.

#### Event: 'kill'

Emitted before sending __SIGKILL__ to __daemon__.
This event is not emitted if __SIGTERM__ was enough to stop the __daemon__.

#### Event: 'stop'

Emitted after __daemon__ is stopped.

#### Event: 'status'

* verbose: {Boolean} __true__ if __status__ is requested from _command line_, __false__ if a status check is perfomed
due a __start__, __stop__ or __restart__ reqest from _command line_.
* pid: {Integer} the _pid_ of the __deamon__ or __null__ if __daemon__ is not running.
* done: {Function}: the function to call to inform __DaemonControl__ object about custom checks or __null__ if
__daemon__ is not running.

Emitted when a __status__ check is performed. This event can be used both to customize _status message_ and to perform
custom check on __daemon__ status. If an handler is bound to this event it must:

1. if __verbose__ is __true__, print a custom _status message_ on console
2. if __done__ is not __null__, call it with a _Boolean_ __true__ parameter (or __false__ if accordingly with custom
checks the __daemon__ is not running)

__Note:__ if an handler is bound to this event, the default _satus message_ is not printed to console.

#### Event: 'help'

Emitted when __help__ is requested from command line.

__Note:__ if an handler is bound to this event, the default _help message_ is not printed to console.

#### Event: 'syntax'

Emitted when there is _syntax error_ in command line.

__Note:__ if an handler is bound to this event, the default _syntax error message_ is not printed to console.

#### Event: 'running'

Emitted when __start__ is requested from command line and the __daemon__ is already running.

__Note:__ if an handler is bound to this event, the default _already running message_ is not printed to console.

### [new] DaemonControl(daemon, filename[, options][, timeout])

Returns a new __DaemonControl__ to control the daemon, parses _command line arguments_ and try to act
as requested by _command line_.

#### daemon {Function}

The daemon entry point.

#### filename {String}

The path to the _pidfile_.

#### options {Object}

Options are proxied to
[child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).
If the __options__ _Object_ (or some one of its _properties_) is not specified, following default values are used:

* cwd: __process.cwd__
* env: __process.env__
* stdio: __'ignore'__
* detached: __true__

#### timeout {Integer}

The timeout (in seconds) before sending __SIGKILL__ to __daemon__, if __SIGTERM__ is not enough to stop it.
If not specified, 5 seconds is the default value.

### Command line parameters

```
$ node daemon.js {start|stop|restart|status|help} [...]
```

The first parameter is consumed by _control script_, from second one to last one (if present) they are passed to the
__daemon__.

#### status

The package checks for the _pidfile_, if it exists its content is read and if it is an _Integer_ the package checks for
process with that _pid_; if this process exists the __daemon__ is running.

#### start

A __status__ command is executed, if the __daemon__ is not running the pakage tries to lauch it.

#### stop

A __status__ command is executed, if the __daemon__ is running the pakage tries to stop it.

#### restart

A __status__ command is executed, if the __daemon__ is running the pakage tries to stop it.
Once this process is completed, the package tries to launch the __daemon__.

#### help

The _help message_ is printed to console.

### Example

```javascript
var dc = require('daemon-control');
var fs = require('fs');

function daemon() {
  if(process.env.recover) {
    var out = fs.createWriteStream(3); // the pipe we added

    out.write("Recovering...");
    // perform recovery procedure
    out.end("Recovered");
  }

  // do daemon stuff
}

function checks() {
  // perform custm checks
}

var controller = dc(daemon, 'daemon.pid');
var recover;

controller.on('status', function(verbose, pid, done) {
  if(! pid) {
    if(verbose)
      console.log('daemon is not running');

    return;
  }

  if(checks())
    return done(true);

  recover = true;
  done(false);
});

controller.on('kill', function() {
  // a SIGKILL was required, let's do recovery procedure
  recover = true;
});

controller.on('start', function(options, done) {
  if(recover) {
    options.env.recover = true;
    options.stdio = ['ignore', 'ignore', 'ignore', 'pipe'];
  }

  done();
});

controller.on('started', function(cp) {
  if(! cp.pid)
    return;

  cp.stdio[3].pipe(process.stdout);
});

controller.on('error', function(err) {
  console.log(err);
});
```

### Compatibility

This package is written following  __Node.js 4.1__ specifications always taking care about backward
compatibility. The package it tested under following versions:
* 4.1
* 4.0
* 0.12
* 0.11

__Note:__ required __Node.js 0.11__.

__Note:__ tested only under __UNIX__.

### Licence

[MIT Licence](https://github.com/iccicci/daemon-control/blob/master/LICENSE)

### Bugs

Do not hesitate to report any bug or inconsistency @[github](https://github.com/iccicci/daemon-control/issues).

### ChangeLog

* 2015-10-15 - v0.0.1
  * Embryonal stage
