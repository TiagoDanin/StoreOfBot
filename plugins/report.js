const base = async (ctx) => {
	if (ctx.privilege <= 4) {
		return
	}

	const id = ctx.match[2]
	await ctx.database.del({id: id})
	ctx.answerCbQuery('Removed!', true)
	return
}

const send = async (ctx) => {
	const id = Number(ctx.match[1])
	let bot = await ctx.database.select({
		id: id
	})
	if (!bot || bot.length <= 0) {
		return
	}
	bot = bot[0]
	const text = `
#Report by ${ctx.from.id} (${ctx.from.username})
${bot.name} (${bot.username})
${bot.description}
	`

	ctx.replyWithMarkdown('*Done!*')
	ctx.telegram.sendMessage(ctx.config.ids.log, text, {
		reply_markup: {
			inline_keyboard:
			[
				[{text: '✅ Remove', callback_data: `report:${bot.id}`}]
			]
		}
	})
	return
}

module.exports = {
	id: 'report',
	plugin: send,
	callback: base,
	regex: [
		/^\/report\s(\d*)$/i
	]
}
