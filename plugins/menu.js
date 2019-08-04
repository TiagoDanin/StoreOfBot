const base = async ctx => {
	let text = 'Welcome!'
	let keyboard = [
		[
			{text: '🤖 Bots', callback_data: 'list:bots'},
			{text: '🗣 Channels', callback_data: 'list:channels'},
			{text: '👥 Groups', callback_data: 'list:groups'}
		],
		[
			{text: '📝 My List', callback_data: 'mylist'},
			{text: '❇️ Add & Edit', callback_data: 'menu:singup'},
			{text: '📔 About', callback_data: 'menu:about'}
		],
		[
			{text: '⚙️ Settings', callback_data: 'config'}
		]
	]

	if (ctx.session.list) {
		ctx.session.list.page = 0
	}

	if (ctx.session.search) {
		ctx.session.search = false
	}

	if (ctx.session.singup) {
		ctx.session.singup = {}
	}

	if (ctx.match[2] == 'singup') {
		text = `
• Channel or Bot
<b>Forward a message</b> from your bot or channel in my private!
• Group
<b>Add this bot</b> to a group with username enabled! (free to remove)

🚫 No pornography or illegal material!
		`
	} else if (ctx.match[2] == 'about') {
		text = `
Search, Explore & Discover the best bots or channel.
👤 <b>Developer:</b> @TiagoEDGE (Tiago Danin)
		`
		keyboard = [
			[
				{text: '📜 Menu', callback_data: 'menu:main'},
				{text: '📊 Stats', callback_data: 'stats'}
			],
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
