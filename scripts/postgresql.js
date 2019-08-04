const {Client} = require('pg')

const client = new Client({
	database: 'storeofbot'
})

const log = text => console.log('>>', text)

// ALTER TABLE users ADD COLUMN reply BOOLEAN DEFAULT true;
const main = async () => {
	await client.connect()
	await client.query(`
		CREATE TABLE users(
			id               INT        NOT NULL,
			language         TEXT       DEFAULT 'English',
			languages        TEXT[]     DEFAULT '{"English"}',
			notification     BOOLEAN    DEFAULT true,
			uptime           TIMESTAMP  DEFAULT now(),
			time             TIMESTAMP  DEFAULT now(),
			PRIMARY KEY (id)
		);
		CREATE TABLE bots(
			id               INT        NOT NULL,
			admin            INT        NOT NULL,
			name             TEXT       NOT NULL,
			username         TEXT       NOT NULL,
			description      TEXT       NOT NULL,
			score            FLOAT      DEFAULT 0,
			languages        INT[]      DEFAULT '{}',
			types            INT[]      DEFAULT '{}',
			categories       INT[]      DEFAULT '{}',
			scores           JSONB      DEFAULT '{}',
			uptime           TIMESTAMP  DEFAULT now(),
			time             TIMESTAMP  DEFAULT now(),
			offline          BOOLEAN    DEFAULT 'f',
			PRIMARY KEY (id)
		);
		CREATE TABLE channels(
			id               bigint     NOT NULL,
			admin            INT        NOT NULL,
			name             TEXT       NOT NULL,
			username         TEXT       NOT NULL,
			description      TEXT       NOT NULL,
			score            FLOAT      DEFAULT 0,
			languages        INT[]      DEFAULT '{}',
			types            INT[]      DEFAULT '{}',
			categories       INT[]      DEFAULT '{}',
			scores           JSONB      DEFAULT '{}',
			uptime           TIMESTAMP  DEFAULT now(),
			time             TIMESTAMP  DEFAULT now(),
			offline          BOOLEAN    DEFAULT 'f',
			PRIMARY KEY (id)
		);
		CREATE TABLE groups(
			id               bigint     NOT NULL,
			admin            INT        NOT NULL,
			name             TEXT       NOT NULL,
			username         TEXT       NOT NULL,
			description      TEXT       NOT NULL,
			score            FLOAT      DEFAULT 0,
			languages        INT[]      DEFAULT '{}',
			types            INT[]      DEFAULT '{}',
			categories       INT[]      DEFAULT '{}',
			scores           JSONB      DEFAULT '{}',
			uptime           TIMESTAMP  DEFAULT now(),
			time             TIMESTAMP  DEFAULT now(),
			offline          BOOLEAN    DEFAULT 'f',
			PRIMARY KEY (id)
		);
	`, []).catch(log)
	await client.end()
}

main()
