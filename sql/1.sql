DROP TABLE IF EXISTS emails;
DROP TABLE IF EXISTS events;

CREATE TABLE emails (
	id text PRIMARY KEY,
	enabled boolean NOT NULL DEFAULT true,
	tags text[] NOT NULL DEFAULT '{}',
	data jsonb NOT NULL DEFAULT '{}',
	done boolean NOT NULL DEFAULT false
);

CREATE INDEX emails_done
ON emails(id)
WHERE done;

CREATE INDEX emails_not_done
ON emails(id)
WHERE NOT done;

CREATE INDEX emails_by_tag
ON emails USING gin(tags);

CREATE TABLE events (
	id uuid PRIMARY KEY,
	email text,
	type text,
	data jsonb,
	occurred timestamp,
	handled timestamp
);

CREATE INDEX events_email_unprocessed
ON events(email, occurred)
WHERE handled IS NULL;
