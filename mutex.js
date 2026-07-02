/**
@licence
    Copyright (c) 2026 Alan Chandler, all rights reserved

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

/*
  use:
    const mutex = new Mutex;

    
    const release = await mutex.lock();
    try {
      ...do stuff
    } finally {
      release();
    }
*/

export class Mutex {
  constructor() {
    this.mutex = Promise.resolve();
  }
  lock() {
    let acceptor;
    const nextLock = new Promise(accept => {
      acceptor = accept;
    });

    const currentLock = this.muxtex.then(() => acceptor)
    this.mutex = nextLock;
    return currentLock;
  }
}