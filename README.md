# server-utils
A Set of Utilities that I generally use on SPA projects for the server side of the project

It consists of 4 separate packages 6 entry points.

The packages are:-

`logger` provides a logging service for the app.  It is controlled by three environment variables LOG_NONE prevents it from logging anything.
This is designed to be used during testing of the server side of the app so that nothing is logged.  LOG_NO_DATE omits the date and time from
the logged output.  This is generally used when another logger (e.g PM2 log output) is also adding date/time.  Finally LOG_HIDDEN_IP is used
to say  to try and anonomise client ip addresses (see below).  `logger` is called so `logger([clientip,] level, ...messages);`.  

`Responder` is a class to provide the ability to stream JSON responses to a node js http request. It is instanciated
with `new Responder(response);` and the resultant object has three methods;

- `addSection(name [,value])` creates a new section in the response of the given name, with an optional value (which should
   be the entirety of a section).
- `write` allows you add an array row to an existing open section (one where `addSection` is called without a value). It will return a 
  promise which resolves when any blockage is cleared.
- `end` signifies the end of stream.  Any attempt to call the other two methods after this has been called will throw an error.

`Version` provides an async function with a single parameter, the path to you
project root) that ultimately resolves to an object which has two
fields.  `version` which is the version string and `year` which is the copyright
year.  The project root is where either the `.git` directory exists (in which case
`version` will ask git for the version and calculate the copyright year from the
last git log entry) or where a `release.info` file is sitting (in which case
`version` will expect that to contain a version string and have a modification
time from which the copyright year can be derived).  If neither of those
possibilities exist it will try to get the version info from the `package.json` file.

`Debug` module provides three entry points, `Debug`, `dumpDebugCache` and
`setDebugConfig`. The `Debug` entry point is the main one, the user calls this a
string representing the topic for the debug stream and we return a function that
will allow him to call with string arguments which will be concatenated (with a
space separator) to form a debug string.  If `setDebugConfig` has already been
called to specify that the topic is to be logged (by providing a colon
separated list of topics to be logged), then this is output. Regardless, all
debug calls are stored in a 50 line cache, and will be output (newest first) on a call
to `dumpDebugCache`

Breaking change as of 3.0.0  logger is now an async function returning a promise fulfilled when (if set) a log file entry is made

both `Debug` and `logger` have had their file logging removed as its causing more issues that its worth


These are installed with as many of few of the items that you want like so:-
```
import {logger,Responder,Debug} from '@akc42/server-utils';
```
