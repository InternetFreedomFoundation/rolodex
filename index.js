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
	index.js - Koa webserver
*/

const
	config = require('./config'),
	app = require('koa')(),
	route = require('koa-route'),
	api = require('./routes');

app.use(require('koa-logger')());
require('koa-qs')(app, 'first');

app.use(require('./koa-token')(config.key));

app.use(route.get('/unsubscribe', api.unsubscribe));
app.use(route.get('/bounce', api.bounce));
app.use(route.get('/complaint', api.complaint));
app.use(route.get('/open', api.open));
app.use(route.get('/click', api.click));

app.use(require('koa-static')(
	require('path').join(__dirname, 'public')
));

app.listen(3000);
