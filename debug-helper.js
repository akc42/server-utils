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
    if (!(Number.isInteger(logtime) && logtime > from)) {
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
