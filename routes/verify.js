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
	saveContact = require('../lib/saveContact'),
	sendEmail = require('../lib/sendEmail')('simple', 'welcome', true),
	sendError = require('../lib/sendError'),
	{ urlVerified } = require('../config');

module.exports = function (req, res) {
	saveContact({ address: res.locals.address, state: 'subscribed' })
	.then(contact => sendEmail({
		to: res.locals.address,
		from: '"Internet Freedom Foundation"<team@internetfreedom.in>',
		subject: 'Welcome!',
		data: contact
	}))
	.then(() => res.redirect(307, urlVerified))
	.catch(sendError(res));
};
