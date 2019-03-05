const base = async (ctx) => {
	let username = ctx.match[1]
	if (ctx.updateType == 'callback_query') {
		username = ctx.session.rate
	} else {
		ctx.session.rate = username
	}

	const bots = await ctx.database.select({username: username})
	const channels = await ctx.database.select({username: username}, 'channels')
	const groups = await ctx.database.select({username: username}, 'groups')
	let db = [
		...bots.map((e) => {
			e.database = 'bots'
			return e
		}),
		...channels.map((e) => {
			e.database = 'channels'
			return e
		}),
		...groups.map((e) => {
			e.database = 'groups'
			return e
		})
	]
	db = db[0]
	let database = db.database
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

	if (ctx.match[2]) {
		const score = ctx.match[2]
		if (score >= 1 && score <= 5) { //Anti-hack
			db.scores[ctx.from.id] = score
			db.offline = false
			const scores = Object.keys(db.scores)
			db.score = scores.map(e => db.scores[e]).reduce((a, b) => Math.floor(a) + Math.floor(b)) / scores.length
			db.score = db.score.toFixed(1)
			await ctx.database.update({
				id: db.id,
				username: db.username,
				scores: db.scores,
				score: db.score,
				offline: db.offline
			}, database)
		}
		ctx.answerCbQuery('Done!', true)
	}

	let text = `
${db.name} (@${db.username})
⭐️(${db.score}) | 👥(${Object.keys(db.scores).length})
${db.description}
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
		/^\/([\w\d_-]*)$/i,
	]
}
