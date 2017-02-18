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

/* eslint-disable no-console */

const
	{ encode } = require('../token'),
	{ tokenKey: key } = require('../config'),
	args = process.argv;

if (args.length < 3) {
	console.log(`Usage: node sign.js <data>`);
	process.exit();
}

if (args.length === 3) {
	console.log(encode(args[2], 1, key));
	process.exit();
}

const data = {};
for (let i = 2; i < args.length; i += 2) {
	data[args[i]] = args[i + 1];
}
console.log('Data', data);
console.log(encode(JSON.stringify(data), 1, key));
