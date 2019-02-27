const base = async (ctx) => {
	const bots = await ctx.database.select()
	const users = await ctx.database.select({}, 'users')
	const channels = await ctx.database.select({}, 'channels')
	const text = `
<b>Total Bots:</b> ${bots.length}
<b>New Bots (24h):</b> ${(bots.filter((e) => e.online)).length}

<b>Total Channels:</b> ${channels.length}
<b>New Channels (24h):</b> ${(channels.filter((e) => e.online)).length}

<b>Total Users:</b> ${users.length}
<b>New Users (24h):</b> ${(users.filter((e) => e.online)).length}
`

	return ctx.editMessageText(text + ctx.fixKeyboard, {
		parse_mode: 'HTML',
		reply_markup: {
			inline_keyboard: [
				[{text: '📜 Menu' , callback_data: 'menu:main' }]
			]
		}
	})
}

module.exports = {
	id: 'stats',
	callback: base
}
