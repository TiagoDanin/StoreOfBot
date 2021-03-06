const fs = require('fs')

const {Pool} = require('pg')

const pool = new Pool({
	database: 'storeofbot'
})

const users = JSON.parse(fs.readFileSync('./Users.backup.JSON').toString())
const bots = JSON.parse(fs.readFileSync('./Bots.backup.JSON').toString())
const channels = JSON.parse(fs.readFileSync('./Channels.backup.JSON').toString())
const groups = JSON.parse(fs.readFileSync('./Groups.backup.JSON').toString())

const log = text => console.log('>>', text)

const insert = async (db, table) => {
	const client = await pool.connect()

	const listKeys = Object.keys(db).filter(e => ![
		'online'
	].includes(e))
	const query = `
		INSERT
		INTO ${table}(${
	listKeys.join(', ')
})
		VALUES (${
	listKeys.reduce((t, e, i) => {
		if (i == 0) {
			return '$1'
		}

		return `${t}, $${i + 1}`
	}, '')
})
		RETURNING *;
	`
	await client.query(
		query,
		listKeys.map(e => db[e])
	).catch(log)
	return client.release()
}

users.forEach(db => insert(db, 'users'))
bots.forEach(db => insert(db, 'bots'))
channels.forEach(db => insert(db, 'channels'))
groups.forEach(db => insert(db, 'groups'))
