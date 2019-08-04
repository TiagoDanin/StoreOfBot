const databases = {
	c: 'channels',
	b: 'bots'
}

const base = async ctx => {
	if (ctx.privilege <= 4) {
		return
	}

	let status = 'Closed!'
	if (ctx.match[2] == 'del') {
		status = 'Removed!'
		await ctx.database.del({id: Math.abs(ctx.match[3])}, databases[ctx.match[4]])
	} else if (ctx.match[2] == 'off') {
		status = 'Offline!'
		await ctx.database.offline({id: Math.abs(ctx.match[3])}, databases[ctx.match[4]])
	}

	ctx.answerCbQuery(status, true)
	return ctx.editMessageText(`${ctx.update.callback_query.message.text}\nStatus: ${status}`, {
		parse_mode: 'HTML',
		disable_web_page_preview: true
	})
}

const send = async ctx => {
	const id = Math.abs(Number(ctx.match[2]))
	const database = databases[ctx.match[1]]
	let db = await ctx.database.select({
		id: Math.abs(id)
	}, database)
	if (!db || db.length <= 0) {
		return
	}

	db = db[0]
	const text = `
#Report by ${ctx.from.id} (${ctx.from.username})
${db.name} (${db.username}) AdminID ${db.admin}
${db.description} Database ${database}
	`

	ctx.replyWithMarkdown('*Done!*')
	ctx.telegram.sendMessage(ctx.config.ids.log, text, {
		reply_markup: {
			inline_keyboard:
			[
				[{text: '❇️ Close Issue', callback_data: 'report:done'}],
				[
					{text: '✅ Remove', callback_data: `report:rem:${db.id}:${ctx.match[1]}`},
					{text: '❕ Offline', callback_data: `report:off:${db.id}:${ctx.match[1]}`}
				]
			]
		}
	})
}

module.exports = {
	id: 'report',
	plugin: send,
	callback: base,
	regex: [
		/^\/report\s([bc])(\d*)$/i
	]
}
