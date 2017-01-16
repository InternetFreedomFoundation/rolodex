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
	config = require('./config'),
	ses = require('node-ses').createClient({
		key: config.awsAccessKeyId,
		secret: config.awsSecretAccessKey,
		amazon: `https://email.${config.awsSesRegion}.amazonaws.com`
	}),
	pg = new (require('pg').native.Pool)({
		host: config.pgHostname,
		user: config.pgUsername,
		password: config.pgPassword,
		database: config.pgDatabase
	}),
	mailPath = `${__dirname}/mailings/${process.argv[2] || 'test'}`,
	mailConfig = require(mailPath),
	render = require('handlebars').compile(
		require('fs').readFileSync(`${mailPath}.hbs`, 'utf8')
	);

console.log(`Mailing: ${mailPath}`);

function readBatch(client) {
	return new Promise((resolve, reject) => {
		client.query(
			'SELECT * FROM emails WHERE NOT done ORDER BY id ASC LIMIT $1',
			[config.batchSize],
			(err, result) => {
				if (err) { return reject(err); }
				console.log(`Read ${result.rows.length} rows`);
				resolve(result.rows);
			}
		);
	});
}

function markDone(client, first, last) {
	return new Promise((resolve, reject) => {
		client.query(
			'UPDATE emails SET done=true WHERE id>=$1 AND id<=$2',
			[first, last],
			(err, result) => {
				if (err) { return reject(err); }
				console.log(`Marked ${result.rowCount} rows done`);
				resolve();
			}
		);
	});
}

function renderEmail(row) {
	return {
		to: config.env === 'prod' ? row.id : config.devMailTo,
		from: mailConfig.from,
		subject: mailConfig.subject,
		message: render(row)
	};
}

function sendEmail(email) {
	return new Promise((resolve, reject) => {
		ses.sendEmail(email, (err, data) => {
			if (err) return reject(err);
			console.log(`Sent to ${email.to}`);
			resolve();
		});
	});
}

function processBatches(client, i) {
	let first, last, complete;

	return 	readBatch(client)
	.then(rows => {
		complete = rows.length < config.batchSize;
		first = rows[0].id;
		last = rows[rows.length - 1].id;

		return Promise.all(rows.map(row => {
			console.log(`Start ${row.id}`);
			return sendEmail(renderEmail(row));
		}));
	})
	.then(() => markDone(client, first, last))
	.then(() => {
		console.log(complete, i);
		!complete && i > 1 && processBatches(client, i - 1)
	});
}

pg.connect((err, client, done) => {
	if (err) { return console.err('PG Connect Error', err); }
	console.log('Connected to database.');
	const start = process.hrtime();

	processBatches(client, config.numBatches)
	.then(() => {
		console.log('Done', process.hrtime(start));
		done();
	})
	.catch(err => {
		console.log('Error', err);
		done();
	});
});
