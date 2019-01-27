const stringify = require('json-stringify-safe')
const base = async (ctx) => {
	if (ctx.privilege <= 6) {
		return
	}
	ctx.telegram.sendMessage(ctx.config.ids.log, '#Backup')
	ctx.telegram.sendDocument(
		ctx.config.ids.log,
		{
			filename: 'Bots.backup.JSON',
			source: Buffer.from(stringify(
				await ctx.database.select()
			), 'utf8')
		}
	)
	return
}

module.exports = {
	id: 'backup',
	plugin: base,
	regex: [
		/^\/backup/i
	]
}
