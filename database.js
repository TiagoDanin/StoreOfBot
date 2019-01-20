const debug = require('debug')
const pg = require('pg').native

const dlogError = debug('bot:error')
const dlogPgQuery = debug('bot:database:query')
const dlogPgValues= debug('bot:database:values')

const Query = pg.Query
const submit = Query.prototype.submit
Query.prototype.submit = function() {
	const text = this.text
	const values = this.values
	const query = values.reduce((q, v, i) => q.replace(`$${i + 1}`, v), text)
	dlogPgValues(values)
	dlogPgQuery(query)
	submit.apply(this, arguments)
}

const { Pool } = pg
const pool = new pg.Pool({
	database: 'storeofbot'
})

const error = (res) => {
	dlogError(res)
	return {
		rowCount: 0,
		error: res,
		rows: []
	}
}

const findAll = async (name) => {
	let data = {}
	let client = await pool.connect()
	data = await client.query(`
		SELECT *
		FROM ${name};
	`, []).catch(error)
	client.release()
	return data.rows
}

module.exports = {
	findAll
}
