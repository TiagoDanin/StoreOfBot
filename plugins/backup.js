const stringify = require('json-stringify-safe')

const base = async ctx => {
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
	ctx.telegram.sendDocument(
		ctx.config.ids.log,
		{
			filename: 'Channels.backup.JSON',
			source: Buffer.from(stringify(
				await ctx.database.select({}, 'channels')
			), 'utf8')
		}
	)
	ctx.telegram.sendDocument(
		ctx.config.ids.log,
		{
			filename: 'Groups.backup.JSON',
			source: Buffer.from(stringify(
				await ctx.database.select({}, 'groups')
			), 'utf8')
		}
	)
	ctx.telegram.sendDocument(
		ctx.config.ids.log,
		{
			filename: 'Users.backup.JSON',
			source: Buffer.from(stringify(
				await ctx.database.select({}, 'users')
			), 'utf8')
		}
	)
}

module.exports = {
	id: 'backup',
	plugin: base,
	regex: [
		/^\/backup/i
	]
}
