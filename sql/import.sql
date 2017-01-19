CREATE TEMPORARY TABLE csv_import ( name text, email text );
\copy csv_import(name, email) FROM '../../list.csv' delimiter ',' csv header;

INSERT INTO emails(id, data)
	SELECT
		coalesce(email, 'unknown@example.com') AS id,
		jsonb_build_object('name', name)::jsonb AS data
	FROM csv_import
ON CONFLICT DO NOTHING;
