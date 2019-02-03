const base = async (ctx) => {
	let username = ctx.match[1]
	if (ctx.updateType == 'callback_query') {
		username = ctx.session.rate
	} else {
		ctx.session.rate = username
	}
	let bot = await ctx.database.select({username: username})
	let keyboard = [
		[
			{text: '⭐️ 1' , callback_data: 'rate:1'},
			{text: '⭐️ 2' , callback_data: 'rate:2'},
			{text: '⭐️ 3' , callback_data: 'rate:3'},
			{text: '⭐️ 4' , callback_data: 'rate:4'},
			{text: '⭐️ 5' , callback_data: 'rate:5'}
		],
		[
			{text: '📜 Menu' , callback_data: 'menu:main' }
		]
	]

	if (bot.length <= 0) {
		return
	} else {
		bot = bot[0]
	}

	if (ctx.match[2]) {
		const score = ctx.match[2]
		if (score >= 1 && score <= 5) { //Anti-hack
			bot.scores[ctx.from.id] = score
			const scores = Object.keys(bot.scores)
			bot.score = scores.map(e => bot.scores[e]).reduce((a, b) => Math.floor(a) + Math.floor(b)) / scores.length
			await ctx.database.update(bot)
		}
		ctx.answerCbQuery('Done!', true)
	}

	let text = `
${bot.name} (@${bot.username})
⭐️(${bot.score}) | 👥(${Object.keys(bot.scores).length})
${bot.description}
	`

	if (ctx.updateType == 'callback_query') {
		return ctx.editMessageText(text + ctx.fixKeyboard, {
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: keyboard
			}
		})
	}
	return ctx.replyWithHTML(text + ctx.fixKeyboard, {
		reply_markup: {
			inline_keyboard: keyboard
		}
	})
}

module.exports = {
	id: 'rate',
	plugin: base,
	callback: base,
	regex: [
		/^\/([\w\d_-]*bot)$/i,
	]
}
