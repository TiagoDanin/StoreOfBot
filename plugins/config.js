const status = (key) => key ? '✅' : '❌'

const base = async (ctx) => {
	const text = '<b>⚙️ Settings</b>'
	const id = ctx.match[2]
	let keyboard = [
		[{text: '📜 Menu' , callback_data: 'menu:main' }]
	]

	if (id && ['notification', 'language'].includes(id)) { //Anti-hack
		if (id == 'language') {
			const codeLang = ctx.match[3] || ''
			if (ctx.config.languages.includes(codeLang)) {
				let index = ctx.db.languages.indexOf(codeLang)
				if (index > -1) {
					ctx.db.languages.splice(index, 1)
				} else {
					ctx.db.languages.push(codeLang)
				}
			}
			keyboard = [
				[{text: '⚙️ Settings', callback_data: 'config'}]
			]

			let keys = ctx.config.languages.map((lang) => {
				return [{
					text: `${status(ctx.db.languages.indexOf(lang) >= 0 ? true : false)} ${lang}`,
					callback_data: `config:language:${lang}`
				}]
			})

			keys = keys.reduce((total, next, index) => {
				if (total[total.length - 1].length >= 3) {
					total.push([])
				}
				total[total.length - 1].push(next[0])
				return total
			}, [[]])

			keyboard = [
				...keyboard,
				...keys
			]
		} else {
			ctx.db[id] = ctx.db[id] ? false : true
			keyboard = [
				[
					{text: '🌍 Languages' , callback_data: 'config:language'},
					{text: `${status(ctx.db.notification)} Global Notification` , callback_data: 'config:notification'}
				],
				[{text: '📜 Menu' , callback_data: 'menu:main' }]
			]
		}
		await ctx.database.update(ctx.db, 'users')
	} else {
		keyboard = [
			[
				{text: '🌍 Languages' , callback_data: 'config:language'},
				{text: `${status(ctx.db.notification)} Global Notification` , callback_data: 'config:notification'}
			],
			[{text: '📜 Menu' , callback_data: 'menu:main' }]
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
	return
}

module.exports = {
	id: 'config',
	plugin: base,
	callback: base,
	regex: [
		/^\/settings/i
	]
}
