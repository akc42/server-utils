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

import {Debug}  from './debug.js';
import {access, readFile, stat} from 'node:fs/promises';
import { resolve } from 'node:path';
import { exec } from 'node:child_process';

const debug = Debug('version');

function shCmd(cmd, root) {
  debug('About to execute Command ', cmd);
  return new Promise((accept, reject) => {
    exec(cmd, { cwd: root }, (err, stdout, stderr) => {
      if (stderr) {
        debug('Command ', cmd, 'about to fail with ', err);
        reject(err);
      } else {
        const out = stdout.trim();
        debug('Command ', cmd, 'Success with ', out);
        accept(out);
      }
    });
  });
}
export default async function(root) {

  let version;
  let vtime;

  try {
    debug('Look for git')
    await access(resolve(root, '.git'));
    debug('Git found, so use it to get data')
    //we get here if there is a git directory, so we can look up version and latest commit from them
    version = await shCmd('git describe --abbrev=0 --tags');
    //git is installed and we found a tag
    try {
      vtime = await shCmd('git log -1 --format=%cd');
    } catch (e) {
      vtime = new Date(); //fake it;
    }
  } catch (e) {
    //no git, or no tag, so we must look for a version file
    try {
      debug('Git approach failed, so look for release info');
      version = await readFile(resolve(root, 'release.info'), 'utf8');
      try {
        const { mtime } = await stat(resolve(root, 'release.info'));
        vtime = mtime;
      } catch (e) {
        vtime = new Date();
      }
    } catch(e) {
      //no release info file, so use package.json
      try {
        const pjsonfile = resolve(root, 'package.json');
        const pjson = await import(pjsonfile);
        version = 'v'+ pjson.version;
        try {
          const { mtime } = await stat(pjsonfile);
          vtime = mtime;
        } catch (e) {
          vtime = new Date();
        }
      } catch(e) {
        version = 'v1.0.0';
        vtime = new Date();
      }
    }
  } finally {
    const finalversion = version.replace(/\s+/g, ' ').trim(); //trim out new lines and multiple spaces just one.
    const copyrightTime = new Date(vtime);
    debug('Resolving with Git copyright Year is ', copyrightTime.getUTCFullYear());
    return({ version: finalversion, year: copyrightTime.getUTCFullYear() });
  }
};

