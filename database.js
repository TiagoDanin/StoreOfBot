const debug = require('debug')
const pg = require('pg').native

const dlogError = debug('bot:error')
const dlogPgQuery = debug('bot:database:query')
const dlogPgValues = debug('bot:database:values')

const {Query} = pg
const {submit} = Query.prototype
Query.prototype.submit = function () {
	const {text} = this
	const {values} = this
	const query = values.reduce((q, v, i) => q.replace(`$${i + 1}`, v), text)
	dlogPgValues(values)
	dlogPgQuery(query)
	submit.apply(this, arguments) // eslint-disable-line prefer-rest-params
}

const pool = new pg.Pool({
	database: 'storeofbot'
})

const error = res => {
	dlogError(res)
	return {
		rowCount: 0,
		error: res,
		rows: []
	}
}

const insert = async (db, table = 'bots') => {
	let data = {}
	const client = await pool.connect()

	const listKeys = Object.keys(db).filter(e => e != 'online')
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

	data = await client.query(
		query,
		listKeys.map(e => db[e])
	).catch(error)

	client.release()
	if (data.rowCount != 1) {
		return false
	}

	return data.rows[0]
}

const select = async (where = {}, table = 'bots') => {
	let data = {}
	const client = await pool.connect()
	data = await client.query(
		`
			SELECT *, EXTRACT(EPOCH FROM ( now() - time ) ) < 86400 AS online
			FROM ${table}
			${
	Object.keys(where).reduce((t, e, i) => {
		if (i == 0) {
			return `WHERE ${e} = $1`
		}

		return `${t} AND ${e} = $${i + 1}`
	}, '')
};
		`,
		Object.keys(where).map(e => where[e])
	).catch(error)
	client.release()
	return data.rows
}

const update = async (db, table = 'bots') => {
	let data = {}
	const client = await pool.connect()

	const listKeys = Object.keys(db).filter(e => e != 'online' && e != 'uptime')
	const query = `
		UPDATE ${table}
			SET
				${
	listKeys.reduce((total, e, index) => {
		return `${total},
						${e} = $${index + 2}`
	}, 'uptime = now()')
}
			WHERE id = $1
		RETURNING *;
	`

	data = await client.query(
		query,
		listKeys.reduce((total, e) => {
			total.push(db[e])
			return total
		}, [db.id])
	).catch(error)
	client.release()
	if (data.rowCount != 1) {
		return false
	}

	return data.rows[0]
}

const del = async (where = {}, table = 'bots') => {
	let data = {}
	const client = await pool.connect()
	data = await client.query(
		`
			DELETE
			FROM ${table}
			${
	Object.keys(where).reduce((t, e, i) => {
		if (i == 0) {
			return `WHERE ${e} = $1`
		}

		return `${t} AND ${e} = $${i + 1}`
	}, '')
};
		`,
		Object.keys(where).map(e => where[e])
	).catch(error)
	client.release()
	return data
}

const selectWithFilter = async (
	categories = [],
	types = [],
	languages = ['English'],
	page = 0,
	order = 'name',
	table = 'bots'
) => {
	let data = {}
	const client = await pool.connect()
	data = await client.query(`
		SELECT *
		FROM ${table}
		WHERE offline IS NOT TRUE AND categories && $1 AND types && $2 AND languages && $4
		ORDER BY ${order}
		LIMIT 3
		OFFSET $3;
	`, [categories, types, page * 3, languages]).catch(error)
	client.release()
	return data.rows
}

const search = async (name, table = 'bots') => {
	let data = {}
	const client = await pool.connect()
	data = await client.query(`
		SELECT *, EXTRACT(EPOCH FROM ( now() - time ) ) < 86400 AS online
		FROM ${table}
		WHERE offline IS NOT TRUE AND name @@ $1;
	`, [name]).catch(error)
	client.release()
	return data.rows
}

const offline = async (where = {}, table = 'bots') => {
	let data = {}
	const client = await pool.connect()
	data = await client.query(
		`
			UPDATE ${table}
			SET offline = 't'
			${
	Object.keys(where).reduce((t, e, i) => {
		if (i == 0) {
			return `WHERE ${e} = $1`
		}

		return `${t} AND ${e} = $${i + 1}`
	}, '')
};
		`,
		Object.keys(where).map(e => where[e])
	).catch(error)
	client.release()
	return data
}

module.exports = {
	select,
	selectWithFilter,
	del,
	insert,
	update,
	search,
	offline
}
