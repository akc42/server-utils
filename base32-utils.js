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
export function hexToBase32(input) {
  let output = '';
  let next = 0;
  let lshift = 0;
  for(let i = 0; i< input.length; i++) {
    let digit = parseInt(input.charAt(i), 16);
    if (!Number.isInteger(digit)) throw new RangeError('Expected string to include only HEX digits');
    if (lshift > 0) {
      const rshift = 4 - lshift;
      const remainder = digit & (2**rshift - 1);
      next |= digit >>> rshift;
      output += alphabet.charAt(next);
      lshift = (lshift + 1) % 5;
      next = remainder << lshift;
    } else {
      lshift++;
      next = digit << lshift;
    }
  }
  if (lshift > 0) output += alphabet.charAt(next);
  return output;
}

/*

The code below was obtained from elsewhere with the attached notice

MIT License

Copyright (c) 2016-2021 Linus Unnebäck

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32ToHex (input) {
  input = input.replace(/=+$/, '')
  const length = input.length
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.ceil(length * 5 / 8) | 0)
  for (var i = 0; i < length; i++) {
    value = (value << 5) | alphabet.indexOf(input[i].toUpperCase())
    bits += 5
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }
  return Buffer.from(output).toString('hex');

}

