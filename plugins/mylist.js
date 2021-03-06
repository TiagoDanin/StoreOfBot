const base = async ctx => {
	let text = '<b>Your list:</b>'
	let keyboard = [
		[{text: '📜 Menu', callback_data: 'menu:main'}]
	]

	const bots = await ctx.database.select({admin: ctx.from.id})
	const channels = await ctx.database.select({admin: ctx.from.id}, 'channels')
	const groups = await ctx.database.select({admin: ctx.from.id}, 'groups')

	const dbs = [
		...bots,
		...channels,
		...groups
	]

	if (dbs.length <= 0) {
		text += '\nEmpty!'
	}

	if (ctx.match[2]) {
		const db = dbs.find(b => b.id == ctx.match[2])
		text += `
Username: ${db.username}
Link: https://telegram.me/${ctx.options.username}?start=${db.username}
		`
	}

	dbs.forEach(db => {
		keyboard.push([{
			text: `🔗 ${db.username}`,
			callback_data: `mylist:${db.id}`
		}])
	})

	keyboard = keyboard.reduce((total, next) => {
		if (total[total.length - 1].length >= 3) {
			total.push([])
		}

		total[total.length - 1].push(next[0])
		return total
	}, [[]])

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
		/^\/me$/i
	]
}
