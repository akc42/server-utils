/**
@licence
    Copyright (c) 2026 Alan Chandler, all rights reserved

    This file is part of @akc42/app-utils.

    @akc42/app-utils is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    @akc42/app-utils is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with @akc42/app-utils.  If not, see <http://www.gnu.org/licenses/>.
*/
import chalk from "chalk";

export const COLOURS = {
  hexmatch: /^#(?:[0-9a-fA-F]{3}){1,2}$/,
  rgbmatch: /^(\d{1,3}), ?(\d{1,3}), ?(\d{1,3})$/,
  COLOURS: {
    app: chalk.rgb(255, 136, 0).bold, //orange,
    db: chalk.greenBright,
    api: chalk.magentaBright,
    client: chalk.redBright,
    log: chalk.hex('#ff651d'),
    mail: chalk.cyanBright,
    //error like have backGround colouring
    auth: chalk.whiteBright.bgBlue,
    error: chalk.whiteBright.bgHex('#ff1165')
  }
 };
const ipmatch = /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.|$)){4}$/;
const datematch =/^(\d{4})-([01]\d)-([0-3]\d) ([0-2]\d):([0-5]\d)(:([0-5]\d)(\.(\d{1,3}))?)?$/;  
let lastdate = '';

export function messageFormatter(logid,logtime, crash, shortdate, ipaddress, topic, message, colourspec, gap) {
  let matches;
  if (typeof logtime === 'string') {
    matches = logtime.match(datematch);
  } else {
    matches = [logtime];
  }
  const logdate = new Date(matches[0]);
  logdate.setMinutes(logdate.getMinutes() + logdate.getTimezoneOffset());
  const displaydate = `${logdate.getFullYear()}-${(logdate.getMonth() + 1).toString().padStart(2,'0')}-${logdate.getDate().toString().padStart(2,'0')}`;
  const displaytime = `${logdate.getHours().toString().padStart(2,'0')}:${logdate.getMinutes().toString().padStart(2,'0')}:${
    logdate.getSeconds().toString().padStart(2,'0')}.${
    (typeof logtime === 'string')? (matches[9]??'').toString().padStart(3,'0') : logdate.getMilliseconds().toString().padStart(3,'0')}`;
  const d = chalk.blueBright(`${displaydate} ${shortdate === 1? displaytime.slice(0,-7): displaytime}`);
  const ip = ipmatch.test(ipaddress)? chalk.red(` [${ipaddress}]`) : '';
  const t = chalk.greenBright(`(${topic})`);
  let m;
  let l = '';
  if (crash === 1) {
    l = chalk.whiteBright(` ${logid}`)
    m = chalk.white.bgRed(message);
  } else if (colourspec in COLOURS.COLOURS) {
    m  = COLOURS.COLOURS[colourspec](message);
  } else if (COLOURS.hexmatch.test(colourspec)) {
    m = chalk.hex(colourspec)(message);
  } else if (COLOURS.rgbmatch.test(colourspec)) {
    const matches = COLOURS.rgbmatch.exec(colourspec);
    m = chalk.rgb(matches[1], matches[2], matches[3])(message);
  } else {
    m = chalk.cyan(message)
  }
  const g = Number.isInteger(gap)?chalk.whiteBright(` gap: ${shortdate? Math.round(gap/60000) + ' mins': gap + 'ms'}`):'';
  let dayoutput = '';
  if (lastdate !== displaydate) {
    dayoutput = `${chalk.whiteBright(displaydate)}:\n`
    lastdate = displaydate;
  }

  return {
    dayoutput: dayoutput,
    message:`${d}${l}${ip} ${t} ${m}${g}`,
    logid: logid,
    ip: ipaddress
  }
};

export function DebugHelper(topic, colourspec, shortdate, immediate, writer) {
  const t = topic;
  const cs = (colourspec in COLOURS.COLOURS) || COLOURS.hexmatch.test(colourspec) || COLOURS.rgbmatch.test(colourspec) ? colourspec : null;
  const sd = shortdate? 1:0;
  let timestamp = Date.now();
  const i = immediate;
  return function (c, logtime ,ip, ...args) {
    let crash = 1;
    if (c !== 'crash') {
      if (ip !== undefined) {
        if (Array.isArray(ip)) args = ip.concat(args); else args.unshift(ip);        
      }
      ip = logtime;
      logtime = c;
      crash = 0;
    }

    const fromDate = new Date(); //logtime is only possible if later than midnight last night.
    const from = fromDate.setHours(0,0,0,0)
    if (!(Number.isInteger(logtime) && logtime > from.getTime())) {
      if (ip !== undefined) {
        if (Array.isArray(ip)) args = ip.concat(args); else args.unshift(ip);        
      }
      ip = logtime;
      logtime = Date.now();
    } 
    if (!ipmatch.test(ip)) {
      if (ip !== undefined){
        if (Array.isArray(ip)) args = ip.concat(args); else args.unshift(ip);        
      }
      ip = null
    }
    const now = Date.now();
    const gap = now - timestamp;
    timestamp = now;
    const message = args.reduce((cum, arg) => {
      if (arg === undefined) return cum;
      return `${cum} ${arg}`.trim();
    },'');
    return writer(logtime, crash, sd, ip, t, message, cs, gap,i)
  }
};
