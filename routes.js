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
	api.js - HTTP endpoints
*/

const
	config = require('./config'),
	pg = new (require('pg').native.Pool)({
		host: config.pgHostname,
		user: config.pgUsername,
		password: config.pgPassword,
		database: config.pgDatabase
	});

exports.unsubscribe = function * unsubscribe (next) {
	yield next;
	pg.query('UPDATE emails SET enabled=false WHERE id=$1', [this.query.email]);
};

exports.bounce = function * bounce (next) {
	yield next;
	pg.query('UPDATE emails SET enabled=false WHERE id=$1', [this.query.email]);
};

exports.complaint = function * complaint (next) {
	yield next;
	pg.query('UPDATE emails SET enabled=false WHERE id=$1', [this.query.email]);
};

exports.open = function * open (next) {
	yield next;
	pg.query(
		'INSERT INTO events(email, type) VALUES ($1, \'open\')',
		[this.query.email]
	);
};

exports.click = function * click (next) {
	this.status = 301;
	this.response.set('Location', this.query.r);
	pg.query(
		'INSERT INTO events(email, type) VALUES ($1, \'click\')',
		[this.query.email]
	);
};
