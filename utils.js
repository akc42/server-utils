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

export function dateToSqliteDate(adate) {
  return  `${adate.getFullYear()}-${('00' + (adate.getMonth() + 1)).slice(-2)}-${('00' + adate.getDate()).slice(-2)}`;
}

export function dateToSqliteDatetime(adate) {
  if (adate === null) return null;
  const displaydate = `${adate.getFullYear()}-${('00' + (adate.getMonth() + 1)).slice(-2)}-${('00' + adate.getDate()).slice(-2)}`;
  const displaytime = `${('00' + adate.getHours()).slice(-2)}:${('00' + adate.getMinutes()).slice(-2)}:${('00' + adate.getSeconds()).slice(-2)}`;
  return `${displaydate} ${displaytime}`;
}
export function denull(r) {
  const row = r;
  for (const field in row) {
    if (row[field] === null || row[field] == undefined) row[field] = '';
  }
  return row;
}

export function nullif0len (str) {
  if (typeof str === 'undefined') return null;
  if (typeof str === 'string' && str.length === 0) return null;
  return str;
};
