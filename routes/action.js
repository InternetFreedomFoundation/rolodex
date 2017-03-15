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
	saveEvent = require('../lib/saveEvent'),
	sendError = require('../lib/sendError'),
	emailSender = require('../lib/sendEmail'),
	sendEmail = {};

module.exports = function (req, res) {
	let {
		email,
		phone,
		campaign,
		state,
		contact
	} = req.body;

	const
		campaignState = campaign + '.' + state,
		eventTags = [ campaign, campaignState ],
		contactTags = [ campaign, campaignState ];

	if (!email && !phone) throw Error('Neither email nor phone provided');
	if (email) eventTags.push('email:' + email);
	if (phone) eventTags.push('phone:' + phone);

	if (!sendEmail[campaignState])
		sendEmail[campaignState] = emailSender(campaignState);

	Promise.all([
		email && saveContact({
			type: 'email',
			address: email,
			tags: contactTags,
			data: contact
		}),
		phone && saveContact({
			type: 'phone',
			address: phone,
			tags: contactTags,
			data: contact
		}),
		saveEvent({
			type: 'action.complete',
			tags: eventTags,
			data: req.body
		})
	])
	.then(([contact, _, event]) => { // eslint-disable-line no-unused-vars
		sendEmail[campaignState]({ to: email, contact, event });
		if (req.body.redirect) {
			res.redirect(303, req.body.redirect);
		} else {
			res.end('Ok');
		}
	})
	.catch(sendError(res));
};
