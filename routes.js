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

	/r Redirecting routes, requires signed token, typically from email
	/w XHR routes, token optional, typically from the web
	/s Server-to-server calls (webhooks), no token expected.

*/

const router = require('express').Router();

router.get('/r/verify', require('./routes/verify'));
router.get('/r/unsubscribe', require('./routes/unsubscribe'));
router.get('/r/open', require('./routes/open'));
router.get('/r/click', require('./routes/click'));

router.post('/w/subscribe', require('./routes/subscribe'));
router.post('/w/act', require('./routes/action'));

router.use('/s/bounce', require('./routes/sesWebhook'));
router.use('/s/complaint', require('./routes/sesWebhook'));
router.use('/s/razorpay', require('./routes/rpWebhook'));

module.exports = router;
