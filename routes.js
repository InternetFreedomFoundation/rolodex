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
	crypto = require('crypto'),
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
	res.redirect(301, this.query.r);
	pg.query(
		'INSERT INTO events(email, type) VALUES ($1, \'click\')',
		[res.locals.email]
	);
});

router.get('/razorpay', (req, res, next) => {
	console.log(req.body);
	let body, sign = req.get('X-Razorpay-Signature');
	console.log('Signature', sign);
	try {
		body = JSON.parse(req.body);
	} catch (e) {
		res.status(400).end('Bad request');
		return next();
	}

	switch(body.event) {
		case 'payment.authorized':
		const {
			id,
			amount,
			currency,
			method,
			email,
			contact
		} = body.payload.payment.entity;
		pg.query(
			'INSERT INTO events(email, type, data) VALUES ($1, \'donate\', $2)',
			[email, JSON.stringify({ amount, contact })]
		);
		request.post(`${config.rpOrigin}/payment/${id}/`, {
			auth: {
				user: config.rpUsername,
				pass: config.rpPassword
			},
			form: {amount}
		});
	}

	res.status(200).end('Ok');
});

module.exports = router;
