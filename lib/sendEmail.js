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
	ses = require('./ses'),
	render = require('./render'),
	{ encode } = require('./token'),
	{ env, testAddress, tokenValidityEmail: days, base } = require('../config'),
	openUrl = `${base}/r/open?t=`,
	clickUrl = `${base}/r/click?t=`,
	verifyUrl = `${base}/r/verify?t=`,
	unsubscribeUrl = `${base}/r/unsubscribe?t=`;

function getTrackingUrl(url, tokenData) {
	const data = Object.assign({ r: url }, tokenData);
	return `href="${clickUrl}${encode(JSON.stringify(data), days)}"`;
}

module.exports = function (layout, content, loadContent) {
	const
		renderHtml = render.html(layout, content, loadContent),
		renderText = render.text(content, loadContent);

	return function({ to, from, cc, bcc, subject, data }) {
		if (env !== 'production') to = testAddress;

		const tokenData = { a: to };
		if (data.campaign) tokenData.c = data.campaign;

		const
			urls = data.urls || (data.urls = {}),
			token = encode(JSON.stringify(tokenData), days);

		urls.open = openUrl + token;
		urls.verify = verifyUrl + token;
		urls.unsubscribe = unsubscribeUrl + token;

		return ses.sendEmail({
			to, from, cc, bcc, subject,
			message: renderHtml(data).replace(
				/href\s*\=\s*["']([^"']*)["']/g,
				(_, url) => getTrackingUrl(url, tokenData)
			),
			altText: renderText(data)
		});
	};
};
