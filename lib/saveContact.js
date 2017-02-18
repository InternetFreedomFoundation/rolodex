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
	if (!address) throw Error('Address not provided.');

	const
		columns = ['type', 'address'],
		params = [type || 'email', address],
		updates = [];

	if (state) {
		columns.push('state');
		params.push(state);
		updates.push('state=$' + (params.length));
		updates.push('toggled=NOW()');
	}

	if (tags) {
		columns.push('tags');
		params.push(JSON.stringify(makeSet(tags)));
		updates.push('tags=c.tags||$' + (params.length));
	}

	if (data) {
		columns.push('data');
		params.push(JSON.stringify(data));
		updates.push('data=c.data||$' + (params.length));
	}

	const sql = `INSERT INTO contacts AS c (${columns.join(',')})
		VALUES (${params.map((_, i) => '$' + (i + 1)).join(',')})
		ON CONFLICT (type, address) DO UPDATE SET ${updates.join(',')}`;

	return pg.query(sql, params);
};
