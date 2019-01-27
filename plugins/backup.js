const stringify = require('json-stringify-safe')
const base = async (ctx) => {
	if (process.env.log_chat != ctx.chat.id) {
		return
	}
	ctx.telegram.sendMessage(process.env.log_chat, '#Backup')
	ctx.telegram.sendDocument(
		process.env.log_chat,
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
