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
	saveEvent = require('../lib/saveEvent');

module.exports = function (req, res) {
	res.redirect(303, req.tracker.redirect)
	saveEvent({
		type: 'email.click',
		tags: [req.tracker.address, req.tracker.campaign, req.tracker.redirect],
		data: {
			// TODO: Location, browser, etc.
		}
	});
};
