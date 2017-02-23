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
	config = require('./config'),
	routes = require('./routes'),
	{ decode } = require('./lib/token'),
	app = express();

app.use(morgan('combined'));
app.use(bodyParser.json());

app.use((req, res, next) => {
	if (req.query.t) { try {
		const { a, c, r } = JSON.parse(decode(req.query.t, config.tokenKey));
		if(a) res.locals.address  = a;
		if(c) res.locals.campaign = c;
		if(r) res.locals.redirect = r;
	} catch (e) { /* do nothing */ } }

	next();
});

app.use('/r/', (req, res, next) => {
	if (!res.locals.address) {
		return res.status(401).end('Unauthorized');
	}
	next();
});

app.use(routes);

app.listen(
	config.port,
	() => console.log( // eslint-disable-line no-console
		`HTTP Server Started: ${config.base}/`
	)
);
