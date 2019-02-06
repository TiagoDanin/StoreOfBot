const base = async (ctx) => {
	const all = await ctx.database.select()
	const users = await ctx.database.select({}, 'users')
	const text = `
<b>Total Bots:</b> ${all.length}
<b>Total Users:</b> ${users.length}
<b>New Bots (24h):</b> ${(all.filter((e) => e.online)).length}
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
