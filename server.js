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
	index.js - Webserver
*/

const
	express = require('express'),
	morgan = require('morgan'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	RateLimit = require('express-rate-limit'),
	{ base, port, tokenValidityCookie } = require('./config'),
	dayMs = 86.4E6,
	routes = require('./routes'),
	{ encode, decode } = require('./lib/token'),
	app = express();

app.use(morgan('combined'));
app.use(new RateLimit({ windowMs: 120000, max: 25, delayMs: 0 }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use((req, res, next) => {
	req.tracker = {};

	if (req.query.t) { try {
		const { a, c, r } = JSON.parse(decode(req.query.t));
		if (a) req.tracker.address  = a;
		if (c) req.tracker.campaign = c;
		if (r) req.tracker.redirect = r;
	} catch (e) { /* do nothing */ } }

	if (req.cookies.t) { try {
		req.tracker.oldAddress = JSON.parse(decode(req.cookies.t)).a;
	} catch (e) { /* do nothing */ } }

	if (req.tracker.address) {
		res.cookie('t', encode(
			JSON.stringify({ a: req.tracker.address }),
			tokenValidityCookie
		), { maxAge: tokenValidityCookie * dayMs });
	}

	next();
});

app.use('/r/', (req, res, next) => {
	if (!req.tracker.address) {
		return res.status(401).end('Unauthorized');
	}
	next();
});

app.use(routes);

// TODO: Move error handling to an error middleware.
// TODO: Link contacts when address !== oldAddress

app.listen(
	port,
	() => console.log( // eslint-disable-line no-console
		`HTTP Server Started: ${base}/`
	)
);
