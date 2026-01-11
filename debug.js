/**
    @licence
    Copyright (c) 2025 Alan Chandler, all rights reserved

    This file is part of PASv5, an implementation of the Patient Administration
    System used to support Accuvision's Laser Eye Clinics.

    PASv5 is licenced to Accuvision (and its successors in interest) free of royality payments
    and in perpetuity in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
    implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. Accuvision
    may modify, or employ an outside party to modify, any of the software provided that
    this modified software is only used as part of Accuvision's internal business processes.

    The software may be run on either Accuvision's own computers or on external computing
    facilities provided by a third party, provided that the software remains soley for use
    by Accuvision (or by potential or existing customers in interacting with Accuvision).
*/

import { EventEmitter } from 'node:events';
import { setTimeout } from 'node:timers/promises';
import chalk from "chalk";
import {openDatabase} from '@akc42/sqlite-db';
import { messageFormatter, COLOURS } from './message-formatter.js';
import { DebugHelper} from './debug-helper.js';

class DebugLogEvents extends EventEmitter {}
/*
  The following events are emitted by the debug log
  
  'log-write': (<formatted message>, <day boundary>, <logid>, <crash>, <ipaddress>, <topic>, <colourspec> )
    <logid> is current message unless <day boundary> is true, in which case it is the logid of the last message of the
            previous day, or 0 if its the first message since startup. If <day-boundary> is true the remaining parameters will be
            null,
    <crash> a true of false setting which says if it was crash or not,
    <ipaddress> if not null is the ip address of the client that caused the message (as a string)
    <topic> the topic of the message.
    <colourspec> One of name of standard colors [app,db,api,client,log,mail,auth,error] else ''
  
  'log-raw' (<log object>)
    <log-object> contains the following fields 
      logid,      This is the same logid as <logid> above, except the <day-boundary> message is not emitted in the raw feed
      logtime,    The number of milliseconds since Unix Epoch, or as a datetime string with optional milliseconds
      logmin,     The number of millisecons since Unix Epoch of logtime rounded to the minute boundary before it.
      crash,      If 1, this entry is a crash report, otherwise its a normal message
      shortdate,  If 1. the request is only to log to the nearest minute, rather than in milliseconds
      ipaddress,  If not null, is the ip address of the client that caused the message (as a string)
      topic,      The topic of this message
      message,    The text of the message is self
      colourspec, One of name of standard colors [app,db,api,client,log,mail,auth,error], a hex color string, an rgb, 
                  comma seperated, string of three values 0-255 
      gap         gap in milliseconds since the last message of the same topic.
*/
export const DebugLog = new DebugLogEvents();

const db = await openDatabase(`${process.env.SQLITE_DB_NAME}-log`)
db.exec(`
    CREATE TABLE IF NOT EXISTS Log (
      logid INTEGER PRIMARY KEY,
      logtime DATETIME NOT NULL DEFAULT (datetime('now','subsec')),
      logmin INTEGER AS (CAST(round((unixepoch(logtime)/60) - 0.5) AS INT)) STORED, 
      crash BOOLEAN NOT NULL DEFAULT 0,
      shortdate BOOLEAN NOT NULL DEFAULT 0,
      ipaddress TEXT,
      topic TEXT,
      message TEXT,
      colourspec TEXT,
      gap INTEGER
  );
  CREATE INDEX IF NOT EXISTS IX_Log_topic ON Log(topic);
  CREATE INDEX IF NOT EXISTS IX_Log_logmin ON Log(logmin);
  CREATE INDEX IF NOT EXISTS IX_Log_crash ON Log(crash);
  PRAGMA journal_mode=WAL;
  `);


export async function awaitTransaction() {
  return new Promise((resolve) => {
    if (db.inTransaction) {
      if (timerAbort.signal.aborted) {
        setTimeout(200,'awaittransaction').then(resolve);
      } else {
        timerAbort.signal.once('abort',resolve);
        timerAbort.abort();
      }
    } else {
     resolve();
    }
  });
}

let timerAbort = new AbortController();

const insertLogTime = db.prepare(`INSERT INTO Log (logtime,crash,shortdate,ipaddress, topic,message,colourspec,gap) VALUES 
  (datetime(?,'unixepoch','subsec'),?,?,?,?,?,?,?)`);

const insertLogNoTime = db.prepare(`INSERT INTO LOG(crash,shortdate,ipaddress, topic,message,colourspec,gap) VALUES (?,?,?,?,?,?,?)`);

const getLogTime = db.prepare('SELECT logtime FROM Log WHERE logid = ?');

/*
  Writes the output to the log, pretty much assumed to be raw
  logtime is in milliseconds since epoch (ie what date gives from Date.getTime())
*/
let shuttingDown = false;

export function logWriter(logtime, crash, shortdate,ipaddress, topic, message, colourspec,gap) {
  if (shuttingDown) return messageFormatter(0,logtime, crash, shortdate,ipaddress, topic, message, colourspec,gap);
  if (!db.isOpen) db.open();
  if (!db.inTransaction) {
    db.exec('BEGIN TRANSACTION;');
    timerAbort = new AbortController();
    setTimeout(1000,'logwriter',timerAbort.signal).then(() => {
      if (db.inTransaction) {
        db.exec('COMMIT;');
      }
    })
  }

  let logid;
  
  if (logtime) {
    const {lastInsertRowid} = insertLogTime.run((logtime/1000), crash, shortdate,ipaddress, topic, message, colourspec,gap);
    logid = lastInsertRowid;

  } else {
    const {lastInsertRowid} = insertLogNoTime.run(crash, shortdate,ipaddress, topic, message, colourspec,gap);
    logid = lastInsertRowid;
    const logtimereq = getLogTime.get(logid);
    logtime = logtimereq.logtime;
  }
  if (crash === 1) timerAbort.abort(); //force the transaction to close;
  
  const output = messageFormatter(logid,logtime, crash, shortdate,ipaddress, topic, message, colourspec,gap);
  if (output.dayoutput.length > 0) {
    DebugLog.emit('log-day', output.dayoutput);
  }
  delete output.dayoutput;
  DebugLog.emit(`log-write`,output.message, logid, (crash === 1), ipaddress, topic, (colourspec in COLOURS.COLOURS)? colourspec: '');
  return output;

};

function logWrapper(logtime, crash, shortdate,ipaddress, topic, message, colourspec,gap, i) {
  const output = logWriter(logtime, crash, shortdate, ipaddress, topic, message, colourspec, gap);
  if (i) console.log(output.message);
  return output;
}

/*
  getDebugLog

    will read the debug log that occured just before the provided logid, and for each row returned will call the callback
    function. The callback function may be asynchronous. the "no" parameter is how many to fetch. The logger uses the
    DEBUG_CACHE_SIZE environment variable to specify this.
*/

async function getDebugLog(callback, loid, no, ip) {
  const lid = loid;
  const limit = no
  const ipadd = ip;
  db.open();
  try {
    await awaitTransaction(); //make sure we have all the info committed before looking for it.
    //we are looking from log entries from the crash backwards in time
    const getLogtime = db.prepare(`SELECT unixepoch(logtime,'subsec') AS logtime FROM Log WHERE logid = ?`)
    const {logtime:lt } = getLogtime.get(lid)??{logtime:0}
    if (lt > 0) {
      const fetchRecords = db.prepare(`SELECT logid, logtime,crash,shortdate,ipaddress, topic,message,colourspec,gap FROM Log 
        WHERE (unixepoch(logtime,'subsec')) * 1000 <= ? AND logid <> ? AND ipaddress = ? ORDER BY unixepoch(logtime,'subsec') DESC LIMIT ?`)
      if (!db.inTransaction) db.exec('BEGIN TRANSACTION');
      for (const {logid,logtime,crash,shortdate,ipaddress,topic,message,colourspec,gap} of fetchRecords.iterate(lt, lid, ipadd??null, limit)) {
        const output = messageFormatter(logid,logtime,crash,shortdate,ipaddress,topic,message,colourspec,gap)
        await callback(output.logid, output.message);
      }
      
    } else {
      console.log(chalk.white.bgBlue('The transaction provided has not yet cleared its transaction, so no records to list.'));
    }
  } catch(e) {
    console.log(chalk.white.bgRed('failed with error'), e.stack);
    throw e;
  } finally {
    if (db.inTransaction) db.exec('ROLLBACK'); //make sure callback hasn't changed anything
    db.close();
  }
}



/*
  Debug creates an instance of a debug function 

  parameters:
    topic       - a value that can be searched for. Useful for dividing into different sections
    colourspec  - One of name of standard colors [app,db,api,client,log,mail,auth,error], a hex color string, an rgb, 
                  comma seperated, string of three values 0-255 
    shortdate   - if true, then dates will be output as YYYY-MM-DD hh:mm else YYYY-MM-DD hh:mm:ss.ms

    immediate   - if set, the message is output (formatted) to the console.
  
  Returns a function that will write a row into the log, using the parameters above and some optional extra values
  these extra parameters are

    crash       - the literal word "crash".  if set, then this will be highlighted in the output. Don't provide this as
                  the first parameter if a normal call
    logtime     - a unix millisecond timestamp.  If provided if must be for today, otherwise it will be as
                  though it were not provided. If provided it will be the logtime, otherwise "Now" will be used.
    ipaddress   - an optional parameter container a string representation of an ip address. Ignored if not
                  a valid adddress. If provided its value will be highlighted and surrounded in "[]"
    ...messages - As many parameters containing parts of the message.  The message will be joined together
                  with a space separation and displayed with the colourspec parameter.
*/

export function Debug (topic, colourspec, shortdate, immediate = false) {
  return DebugHelper(topic, colourspec, shortdate, immediate, logWrapper);
};



/*
  Logger is like Debug (indeed its a wrapper for it) except

  - It doesn't need short date, or immediate parameters as thats whats assumed

  - If a crash, all the messages just before the crash (especially the debug ones that were not output before), are also
    printed to the consolein reverse order
*/

export function Logger(topic, colourspec) {
  const debug = Debug(topic, colourspec, 1,1);
  return function(c, ip, ...args) {
    const crash = (c === 'crash');
    const output = debug(c,ip,args);
    console.log(output.message);
    if (crash) {
      let lt;
      getDebugLog(async(logid,message) => {
        if (lt === undefined) lt=message.substring(0,24);
        console.log(chalk.whiteBright(logid), message)
      },output.logid,Number(process.env.DEBUG_CACHE_SIZE??100), output.ip).then(() => {
        console.log(chalk.whiteBright(lt),chalk.white.bgBlue('Above are all the debug calls (most recent first) which lead up to the error above') )

      });
    }
  }
}

/*
  Closes the database and ensures any partial transactions are written
*/

export function close() {
  shuttingDown = true;
  DebugLog.emit('close');
  if (db.inTransaction) {
    db.exec('COMMIT;');
  }
  if(db.isOpen) db.close();
  

};




