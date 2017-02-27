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
	{ batchSize, idleTimeout } = require('./config'),
	emailSender = require('./lib/sendEmail'),
	sendEmail = {},
	pg = require('./lib/pg'),
	start = process.hrtime();

function emailBatch(data, mark) {
	const
		{ campaign } = data,
		send = sendEmail[campaign] || (
			sendEmail[campaign] = emailSender(campaign)
		);

	console.log('DO_EMAIL', data, mark);

	return pg.query(
		`SELECT * FROM contacts WHERE type='email' AND id > $1
		ORDER BY id ASC LIMIT $2`,
		[ mark, batchSize ]
	)
	.then(result => {
		mark = result.rows.length === batchSize &&
			result.rows[result.rows.length - 1].id;

		console.log('BATCH', result.rows);

		return Promise.all(result.rows.map(contact => send({
			to: contact.address,
			campaign: campaign,
			campaignData: data,
			contact
		})));
	})
	.then(() => mark);
}

const workers = {
	email: emailBatch,
	sms: () => {}
};

function work() {
	let jobId, more;

	console.log('START BATCH');

	pg.query(
		`SELECT * FROM jobs WHERE state='started'
		ORDER BY priority DESC LIMIT 2`
	)
	.then(result => {
		if (!result.rows.length) {
			console.log('NO JOBS');
			more = false;
			return null;
		}

		const { id, type, data, mark } = result.rows[0];
		jobId = id;
		more = result.rows.length > 1;
		console.log(`${process.hrtime(start)} BEGIN ${data.campaign}[${mark}`);

		return workers[type](data, mark);
	})
	.then(mark => {
		// mark will be null if this is the last batch of this job
		more = more || mark;

		console.log(`${process.hrtime(start)} FINISH ${mark}`);

		if(mark) { return pg.query(
			`UPDATE jobs SET mark=$1, updated=NOW() WHERE id=$2`,
			[ mark, jobId ]
		); } else { return pg.query(
			`UPDATE jobs SET mark=0, state='ended', updated=NOW()
			WHERE id=$1`,
			[ jobId ]
		); }
	})
	.then(() => more ? process.nextTick(work) : setTimeout(work, idleTimeout))
	.catch(error => {
		console.error('ERROR', jobId, error);
		pg.query(
			`UPDATE jobs SET state='aborted', updated=NOW() WHERE id=$1`,
			[ jobId ]
		)
	});
}

work();
