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
	Usage:

	sendEmail = require('lib/sendEmail')(layout, content, [loadContent])

	layout: Mandatory, name of an hbs template, e.g. "simple".
	content: Markdown content or name of a markdown file.
	loadContent: if true, 'content' is treated as the name of a markdown file,
		if false or undefined, it is considered a markdown string.

	The return value is a function that can be called with a JSON object to render the email and send it. The argument may have the following properties:

	- to: mandatory (to address)
	- from: mandatory
	- cc, bcc, subject: optional
	- data: data passed to the template to render the email.

*/

const
	fs = require('fs'),
	path = require('path'),
	parseFrontMatter = require('front-matter'),
	ses = require('./ses'),
	render = require('./render'),
	{ encode } = require('./token'),
	{ env, testAddress, tokenValidityEmail: days, base } = require('../config');

const baseUrls = {
	'rx:open': `${base}/r/open?t=`,
	'rx:click': `${base}/r/click?t=`,
	'rx:verify': `${base}/r/verify?t=`,
	'rx:unsubscribe': `${base}/r/unsubscribe?t=`,
};

const commonUrls = {
	open: 'rx:open',
	verify: 'rx:verify',
	unsubscribe: 'rx:unsubscribe'
};

const urlRegex = /(href|src)\s*\=\s*["']([^"']*)["']/g;

function load(name) {
	console.log(`LOAD_TPL ${name}`); // eslint-disable-line no-console
	return new Promise((resolve, reject) => fs.readFile(
		path.join(__dirname, `../templates/${name}`),
		'utf8',
		(err, content) => err ? reject(err) : resolve(content)
	));
}

module.exports = function (template) {
	const queue = [];
	let
		loaded = false,
		error,
		body,
		commonData,
		renderHtml,
		renderText;

	function send(data) {
		data = Object.assign({}, commonData, data);
		let { to, from, cc, bcc, subject, campaign } = data;

		if (env !== 'production') to = testAddress;
		data.urls = commonUrls;

		const tokenData = { a: to };
		if (campaign) tokenData.c = campaign;

		const getUrl = (_, attr, url) => {
			const [ base, td ] = (url in baseUrls) ?
				[ baseUrls[url], tokenData ] :
				[ baseUrls['rx:click'], Object.assign({ r: url }, tokenData) ];

			return `${attr}="${base}${encode(JSON.stringify(td), days)}"`;
		};

		return ses.sendEmail({
			to, from, cc, bcc, subject,
			message: renderHtml(data).replace(urlRegex, getUrl),
			altText: renderText(data)
		});
	}

	load(`${template}.md`)
	.then(content => parseFrontMatter(content))
	.then(content => {
		body = content.body;
		renderText = render.text(body);
		commonData = Object.assign({}, content.attributes);
		delete commonData.layout;
		return load(`${content.attributes.layout}.hbs`);
	})
	.then(layout => {
		renderHtml = render.html(layout, body);
		loaded = true;
		console.log('DONE_LOAD_TPL', template);
		for (const { data, resolve, reject } of queue) {
			send(data).then(resolve).catch(reject);
		}
	})
	.catch(err => {
		console.log('ERR_LOAD_TPL', err);
		error = err;
	});

	return function (data) {
		if (loaded) return send(data);
		if (error) return Promise.reject(error);

		return Promise((resolve, reject) => {
			queue.push({ data, resolve, reject });
		});
	}
};
