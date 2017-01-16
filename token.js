/*
	Rolodex, high-performance email list software.

	Copyright (c) Internet Freedom Foundation.

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
	token.js - Simple Stateless Identity Tokens

	Creates long-lived session tokens for use-cases that preclude
	server-side session storage. They are similar to JSON Web Tokens
	but more compact at the cost of flexibility.

	Unlike JWT, they are also not suitable for use cases where the
	encrypting and decrypting parties are not the same.
*/

const
	crypto = require('crypto');

function expiry(days) {
	return Math.round(new Date(Date.now() + days * 86.4E6).getTime() / 1000);
}

function encode(sub, exp, key) {
	const
		msg = Buffer.concat([
			Buffer.alloc(4, exp.toString(16), 'hex'),
			Buffer.from(sub)
		]),
		hmac = crypto.createHmac('sha224', key).update(msg).digest(),
		cipher = crypto.createCipher('aes-256-gcm', key),
		cip = cipher.update(msg, null, 'base64') + cipher.final('base64'),
		tag = cipher.getAuthTag().toString('base64');

	return cip.replace(/\=+$/, '') + '.' + tag.replace(/\=+$/, '');
}

function decode(enc, key) {
	const
		[ cip, tag ] = enc.split('.'),
		decipher = crypto.createDecipher('aes-256-gcm', key)
			.setAuthTag(Buffer.from(tag, 'base64')),
		msg = Buffer.concat([
			decipher.update(cip, 'base64'),
			decipher.final()
		]),
		exp = msg.readUInt32BE(0),
		sub = msg.toString('utf8', 4);

	if (exp < expiry(0)) throw(Error('Token expired'));

	return sub;
}

exports.encode = encode;
exports.decode = decode;

// let
// 	sub = 'aravindet@gmail.com',
// 	exp = expiry(30),
// 	key = 'hush, this is a secret',
// 	enc = encode(sub, exp, key),
// 	dec = decode(enc, key);
//
// console.log(enc.length, enc, dec === sub);
