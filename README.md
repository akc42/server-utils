# server-utils
A Set of Utilities that I generally use on SPA projects for the server side of the project

It consists of 4 separate packages 5 entry points.

The packages are:-

## The Debug Suite

This package is a complete debugging solution.  The basic concept is that messages get written to a database to be
available for examination in the future. Messages can be immediately written to the console (that is called `logging`),
Also if the message was a "crash", the previous `<n>` (where `<n>` is determined from the `DEBUG_CACHE_SIZE` environment
if it exists, else 100) is re-read from the database and also written to the console.

The **COLOURS** constant is an object contains a set of predefined colours (using the `npm chalk` package) for its properties of `app`,`db`,`api`,`client`, `log`, `mail`, `auth` and `error`.  A *colourspec* is defined as one of those predefined colours or a hex string (hex digits preceeded by a `#`) or an rgb value (a string of three comma separated numbers between 0 and 255) and that will be used to colour the message itself when (and if) is is written to the console. 

If the *shortdate* is defined (defaults to false) then the message, when eventually written to the console, is formatted as "YYYY-MM-DD hh:mm" otherwise it is
formatted as "YYYY-MM-DD hh:mm:ss.sss" (ie to millisecond accuracy).

The *immediate* parameter says to immediately, after logging to the database, to format the message and output it.

When called the **Debug** function returns a function which is the actual *logger*.  This function can then be called with any number of parameters.  The first three, if present, are checked to match the requirement, but if not are assumed not to be present.  These are

- *crash*  the literal string "crash" - see above for its meaning.  In this case the *colourspec* is ignored and the
  message is printed in white on a red background.
- *logtime* A unix timestamp with millisecond accuracy (e.g the result from `Date.now()`), Its only considered valid if
  it is for today, although it can be earlier than the current time.
- *ipaddress* An ipv4 address as a string.
- *...messages* Any number of parameters following which are joined together with a space.

Formally **Debug** is called like this:-

```javascript
  const debug = Debug(topic,colourspec, shortdate, immediate); 

  debug([crash,][,logtime][ipaddress,]...messages);
```

This `debug` instance also remembers the time between calls and this time is logged (and subsequently printed) as a "gap". This is printed in milliseconds unless it was a "shortdate" in which case it is printed in minutes.

**Logger** is a function that is a wrapper for *Debug* where `shortdate` and `immediate` are both true. 


## Responder

**Responder** is a class to provide the ability to stream JSON responses to a node js http request. It is instanciated
with `new Responder(response);` and the resultant object has three methods;

- *addSection* called like
  
  ```javascript
  addSection(name [,value])
  ```
  which creates a new *Object property* in the response of the given name, with an optional value (which should be the entirety of a section).

- *write* allows you add an array row to an existing open section (one where *addSection* is called without a value). It
  will return a promise which resolves when any blockage is cleared. It is recommended to use this when an array of
  database rows will return more than a very limited number.
- *end* when signifies the end of stream.  Any attempt to call the other two methods after this has been called will throw an error.
  
## Version

**getVersion** is an async function with a single parameter, the path to your project root.

It ultimately resolves to an object which has two fields.  `version` which is the version string and `year` which is the
copyright year.  The project root is where either the `.git` directory exists (in which case `version` will ask git for
the version and calculate the copyright year from the last git log entry) or where a `release.info` file is sitting (in
which case `version` will expect that to contain a version string and have a modification time from which the copyright
year can be derived).  If neither of those possibilities exist it will try to get the version info from the
`package.json` file.

## Utils

**nullif0len** is the only function currently in this package.  It is a function that takes a single parameter.  If that parameters is either undefined or a string that has zero length it returns null. Otherwise it returns what was input.