const base = async (ctx) => {
	let text = '<b>Your list:</b>'
	let keyboard  = [
		[{text: '📜 Menu' , callback_data: 'menu:main'}],
	]

	const bots = await ctx.database.select({admin: ctx.from.id})
	if (bots.length <= 0) {
		text += '\nNot found!'
	}

	if (ctx.match[2]) {
		let bot = bots.find(b => b.id == ctx.match[2])
		text += `
Username: ${bot.username}
Link: https://telegram.me/${ctx.options.username}?start=${bot.username}
		`
	}

	bots.forEach((bot) => {
		keyboard.push([{
			text: `🔗 ${bot.username}`,
			callback_data: `mylist:${bot.id}`
		}])
	})

	if (ctx.updateType == 'callback_query') {
		return ctx.editMessageText(text + ctx.fixKeyboard, {
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: keyboard
			},
			disable_web_page_preview: true
		})
	}
	return ctx.replyWithHTML(text + ctx.fixKeyboard, {
		reply_markup: {
			inline_keyboard: keyboard
		},
		disable_web_page_preview: true
	})
}

module.exports = {
	id: 'mylist',
	plugin: base,
	callback: base,
	regex: [
		/^\/me/i
	]
}
