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
	router = require('express').Router(),
	pg = new (require('pg').Pool)({
		host: config.pgHostname,
		user: config.pgUsername,
		password: config.pgPassword,
		database: config.pgDatabase
	});

router.get('/unsubscribe', (req, res, next) => {
	if (!res.locals.email) {
		return res.status(201).render('page', {
			title: 'Unauthorized',
			body: 'Maybe the link you clicked is very old?'
		});
	}

	pg.query(
		'UPDATE emails SET enabled=false WHERE id=$1',
		[res.locals.email]
	)
	.then(() => {
		res.render('page', {
			title: 'Unsubscribed',
			body: `We won’t email ${res.locals.email} anymore.`
		});
	})
	.catch (err => {
		res.status(500).render('page', {
			title: 'Internal Server Error',
			body: 'We couldn’t unsubscribe you. ☹'
		});
	});
});

router.get('/bounce', (req, res, next) => {
	pg.query('UPDATE emails SET enabled=false WHERE id=$1', [res.query.email]);
});

router.get('/complaint', (req, res, next) => {
	pg.query('UPDATE emails SET enabled=false WHERE id=$1', [res.query.email]);
});

router.get('/open', (req, res, next) => {
	pg.query(
		'INSERT INTO events(email, type) VALUES ($1, \'open\')',
		[res.locals.email]
	);
});

router.get('/click', (req, res, next) => {
	this.status = 301;
	this.response.set('Location', this.query.r);
	pg.query(
		'INSERT INTO events(email, type) VALUES ($1, \'click\')',
		[res.locals.email]
	);
});

module.exports = router;
