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

const
	pg = require('./pg'),
	makeSet = require('./makeSet');

module.exports = function ({ type, state, address, tags, data }) {
	type = type || 'email';
	state = state || 'unverified';
	if (!address) throw Error('Address not provided.');
	tags = tags ? JSON.stringify(makeSet(tags)) : '{}';
	data = data ? JSON.stringify(data) : '{}';

	return pg.query(
		`INSERT INTO contacts AS c (type, state, address, tags, data)
			VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (type, address) DO UPDATE
			SET state=$2, tags=c.tags||$4, data=c.data||$5, updated=NOW()
		RETURNING id, identity, created, updated`,
		[type, state, address, tags, data]
	);
};
