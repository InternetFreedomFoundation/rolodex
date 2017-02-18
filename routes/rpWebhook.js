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

/* TODO: Implement fully */
/* eslint-disable no-unused-vars */

const
	request = require('request'),
	saveEvent = require('../lib/saveEvent'),
	sendError = require('../lib/sendError'),
	{ rpOrigin, rpUsername, rpPassword } = require('../config');

function verifySignature(body, sign) {
	// TODO: Implement to prevent CSRF.
	return true;
}

function handleAuthorize(body) {
	const {
		id,
		amount,
		currency,
		method,
		email,
		contact: phone,
	} = body.payload.payment.entity;

	return saveEvent('donate', [email], {})
	/* Capture the Payment */
	.then(() => request.post(`${rpOrigin}/payment/${id}/`, {
		auth: {
			user: rpUsername,
			pass: rpPassword
		},
		form: {amount}
	}));
}

module.exports = (req, res, next) => {
	let body, sign = req.get('X-Razorpay-Signature');

	try {
		if (!verifySignature(req.body, sign)) throw Error();
		body = JSON.parse(req.body);
	} catch (e) {
		res.status(400).end('Bad request');
		return next();
	}

	switch(body.event) {
	case 'payment.authorized':
		handleAuthorize(body)
		.then(() => res.end('Ok'))
		.catch(sendError(res));
	}
};
