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

DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS jobs;
DROP TYPE IF EXISTS ContactType;
DROP TYPE IF EXISTS ContactState;
DROP TYPE IF EXISTS EventType;
DROP TYPE IF EXISTS JobType;

CREATE TYPE ContactType AS ENUM('email', 'phone');
CREATE TYPE ContactState AS ENUM(
	'subscribed',
	'unverified',
	'unsubscribed',
	'bounced',
	'complained'
);
CREATE TYPE EventType AS ENUM(
	'email.open',
	'email.click',
	'action.view',
	'action.progress',
	'action.complete'
);
CREATE TYPE JobType AS ENUM('email', 'sms');

/*
	All tables use a UUID primary key, which will have V1 UUIDs (timestamp-based) to ensure monotonic ordering. This allows sequential access in ID order (for processing bulk jobs) to roughly follow the heap layout.
*/

/*
	All supporter information is in the contacts table, which is denormalized
	for performance.

	A single person may have multiple contacts with different (type, address) pairs, in which case they will have the same identity (by convention the
	uuid of the first non-deleted contact of that person) and
*/

CREATE TABLE contacts (
	id serial PRIMARY KEY,
	identity integer NOT NULL DEFAULT currval('contacts_id_seq'),
	type ContactType NOT NULL,
	state ContactState NOT NULL DEFAULT 'unverified',
	address text NOT NULL,
	tags jsonb NOT NULL DEFAULT '{}',
	data jsonb NOT NULL DEFAULT '{}', -- name, designation, organization
	created timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	toggled timestamp, -- last state change to/from 'subscribed'
	sent timestamp,    -- last outgoing communication (email)
	seen timestamp     -- last incoming activity
);

CREATE UNIQUE INDEX contacts_by_address
ON contacts(type, address);

CREATE INDEX contacts_by_identity
ON contacts(identity);

CREATE INDEX contacts_by_tag
ON contacts USING gin(tags);

CREATE TABLE events (
	id serial PRIMARY KEY,
	type EventType NOT NULL,
	tags jsonb NOT NULL DEFAULT '{}',
	data jsonb NOT NULL DEFAULT '{}',
	occurred timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX events_by_tag
ON events USING gin(tags);

CREATE TABLE jobs (
	id serial PRIMARY KEY,
	type JobType NOT NULL,
	data jsonb NOT NULL DEFAULT '{}',
	mark uuid,
	started timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	ended timestamp
);

CREATE INDEX jobs_ongoing_by_type
ON jobs(type) WHERE ended IS NULL;
