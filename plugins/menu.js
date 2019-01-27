const base = async (ctx) => {
	let text = 'Welcome!'
	let keyboard = [
		[
			{text: '🤖 Bots' , callback_data: 'list' }
		],
		[
			{text: '❇️ Add You Bot', callback_data: 'menu:singup'}
		],
		[
			{text: '📔 About' , callback_data: 'menu:about' }
		]
	]

	if (ctx.match[2] == 'singup') {
		text = `
<b>Forward a message</b> from your bot in my private!
🚫 No pornography or illegal material!
		`
	} else if (ctx.match[2] == 'about') {
		text = `
👤 <b>Developer:</b> @TiagoEDGE (Tiago Danin)
		`
		keyboard = [
			[{text: '📜 Menu' , callback_data: 'menu:main' }],
			[{text: '📊 Stats' , callback_data: 'stats' }],
			[{
				text: 'Twitter @_TiagoEDGE',
				url: 'twitter.com/_tiagoedge'
			}, {
				text: 'TiagoDanin.github.io',
				url: 'tiagoDanin.github.io'
			}]
		]
	}

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
	id: 'menu',
	plugin: base,
	callback: base,
	regex: [
		/^\/start/i,
		/^\/about/i,
		/^\/help/i,
		/^\/sobre/i,
		/^\/ajuda/i
	]
}
