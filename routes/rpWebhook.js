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

/* eslint-disable no-console */

const
	fetch = require('node-fetch'),
	saveContact = require('../lib/saveContact'),
	saveEvent = require('../lib/saveEvent'),
	sendError = require('../lib/sendError'),
	{ rpOrigin, rpKeyId, rpKeySecret } = require('../config');

function verifySignature() {
	// TODO: Implement to prevent CSRF.
	return true;
}

function btoa(str) {
	return Buffer.from(str).toString('base64');
}

function handleAuthorize(body) {
	const {
		id,
		amount,
		email,
		contact: phone,
	} = body.payload.payment.entity;

	return Promise.all([
		saveContact({
			type: 'email',
			address: email,
			tags: ['donate.complete']
		}),
		saveContact({
			type: 'phone',
			address: phone,
			tags: ['donate.complete']
		}),
		saveEvent({
			type: 'action.complete',
			tags: [email, 'donate'],
			data: body.payload.payment.entity
		})
	])
	/* Capture the Payment */
	.then(() => fetch(`${rpOrigin}/payments/${id}/capture`, {
		method: 'post',
		headers: {
			'Authorization': 'Basic ' + btoa(rpKeyId + ':' + rpKeySecret),
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: `amount=${amount}`
	}))
	.then(response => response.json())
	.then(res => {
		if (res.error) {
			console.log(`ECAPTURE ${res.error.code} ${res.error.description}`);
			throw Error(res.error.code);
		}
		if (res.status !== 'captured') {
			console.log(`ECAPTURE ${res.status}`);
			throw Error(res.status);
		}
		console.log(`Payment Captured: ${id}`);
	});
}

function handleFailure(body) {
	const {
		email,
		contact: phone,
	} = body.payload.payment.entity;

	return Promise.all([
		saveContact({
			type: 'email',
			address: email,
			tags: ['donate.start']
		}),
		saveContact({
			type: 'phone',
			address: phone,
			tags: ['donate.start']
		}),
		saveEvent({
			type: 'action.complete',
			tags: [email, 'donate'],
			data: body.payload.payment.entity
		})
	]);
}

module.exports = (req, res) => {
	let
		body = req.body,
		sign = req.get('X-Razorpay-Signature');

	if (!verifySignature(body, sign)) {
		console.log('EVERIFY', body, sign);
		res.write(200).end('Bad Request: Signature verification failed.');
		return;
	}

	switch(body.event) {
	case 'payment.authorized':
		console.log(`Payment Authorized ${body.payload.payment.entity.id}`);
		handleAuthorize(body)
		.then(() => res.end('Ok'))
		.catch(sendError(res));
		return;
	case 'payment.failed':
		console.log(`Payment Failed ${body.payload.payment.entity.id}`);
		handleFailure(body);
		res.end('Ok');
		return;
	}
};
