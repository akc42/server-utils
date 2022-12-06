/**
@licence
    Copyright (c) 2021 Alan Chandler, all rights reserved

    This file is part of Server Utils.

    Server Utils is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Server Utils is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Server Utils.  If not, see <http://www.gnu.org/licenses/>.
*/

import chalk from 'chalk';
let config = '';
let cache = [];
  
export function Debug (topic) {
    const t = topic;
    let timestamp = new Date().getTime();
    return function (...args) {
      let enabled = false;
      if (config) {
        const topics = config.split(':');
        if (topics.includes(t)) enabled = true;
      }
      const now = new Date().getTime();
      const gap = now - timestamp;
      timestamp = now;
      const message = args.reduce((cum, arg) => {
        return `${cum} ${arg}`.trim();
      }, '');      
      const output = `${chalk.greenBright(topic)} ${chalk.cyan(message)} ${chalk.whiteBright(`(${gap}ms)`)}`
      if (enabled) {
        console.log(output);
      } 
      cache.push(output);
      cache.splice(0,cache.length - 50); //prevent it getting too big  
  }
};
export function dumpDebugCache() {
  const output = chalk.white.bgBlue('Above are all the debug calls (most recent first) which lead up to, and then followed on from, the error above');
  cache.reverse();
  for(const line of cache) {
    console.log(line);
  }
  cache.reverse();
  console.log(output);
};
export function setDebugConfig(con) {
  if (con !== config) {
    config = con;
    const output = `${chalk.greenBright('debug server config')} ${chalk.redBright(`new server config "${config}"`)}`
    console.log(output);
  }
};




