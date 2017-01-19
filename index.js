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
	config = require('./config'),
	express = require('express'),
	expressHandlebars = require('express-handlebars'),
	app = express(),
	routes = require('./routes'),
	{ decode } = require('./token');

app.engine('hbs', expressHandlebars());
app.set('view engine', 'hbs');

app.use((req, res, next) => {
	if (req.query.e) { try {
		res.locals.email = decode(req.query.e, config.tokenKey);
	} catch (e) { } }

	next();
});

app.use(routes);

app.listen(3000, () => console.log('Listening at http://localhost:3000'));
