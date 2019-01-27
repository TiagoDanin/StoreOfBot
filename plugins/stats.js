const base = async (ctx) => {
	const all = await ctx.database.select()
	const text = `
<b>Total Bots:</b> ${all.length}
<b>New Bots:</b> ${(all.filter((e) => e.online)).length}`

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
