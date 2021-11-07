# server-utils
A Set of Utilities that I generally use on SPA projects for the server side of the project

It consists of 4 separate packages.  

`database` is a module to open (creating it if it doesn't yet exist from a `database.sql` file).  It uses two environment 
variables to locate the database DATABASE_DB_DIR and DATABASE_DB are the directory and filename respectively of the sqlite3 
database. It also used DATABASE_DB_BUSY for the busy timeout.  DATABASE_DB_DIR can either be an absolute value, or relative 
from the project root (see npm module `app-root-path`). If the database file does not exist, it attempt to create it from the script
read from file named by DATABASE_INIT_FILE.  The path can be relative to project root or an absolute value.

`logger` provides a logging service for the app.  It is controlled by three environment variables LOG_NONE prevents it from logging anything.
This is designed to be used during testing of the server side of the app so that nothing is logged.  LOG_NO_DATE omits the date and time from
the logged output.  This is generally used when another logger (e.g PM2 log output) is also adding date/time.  Finally LOG_NO_ENCODE is used
to say don't try and anonomise client ip addresses (see below).  `logger` is called so `logger([clientip,] level, ...messages);`.  

`Responder` is a class to provide the ability to stream JSON responses to a node js http request. It is instanciated
with `new Responder(response);` and the resultant object has three methods;

- `addSection(name [,value])` creates a new section in the response of the given name, with an optional value (which should
   be the entirety of a section).
- `write` allows you add an array row to an existing open section (one where `addSection` is called without a value). It will return a 
  promise which resolves when any blockage is cleared.
- `end` signifies the end of stream.  Any attempt to call the other two methods after this has been called will throw an error.

`version` provides a promise that ultimately resolves to an object which has two
fields.  `version` which is the version string and `year` which is the copyright
year.  It does this with the help of the npm module `app-root-path` read the
instructions for that module if it doesn't give the right result for you. The
project root is where either the `.git` directory exists (in which case
`version` will ask git for the version and calculate the copyright year from the
last git log entry) or where a `release.info` file is sitting (in which case
`version` will expect that to contain a version string and have a modification
time from which the copyright year can be derived).  If neither of those
possibilities exist it will try to get the version info from the `package.json` file.

These can either be installed all together
```
const {logger,database,version,Responder} = require('@akc42/server-utils');
```
or individually
```
const logger = require('@akc42/server-utils/logger');
```
