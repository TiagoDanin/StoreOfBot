const databases = {
	bots: 'b',
	channels: 'c'
}

const orders = [{
	name: 'Name',
	id: 'name',
	query: 'name'
}, {
	name: 'Score',
	id: 'score',
	query: 'score DESC'
}, {
	name: 'New',
	id: 'new',
	query: 'time DESC'
}]
/*
{
	name: 'Most Users',
}, {
	name: 'Tops',
}
*/

const status = (key) => key ? '✅' : '❌'

const link = (ctx, cmd, name) => {
	return `<a href="https://telegram.me/${ctx.options.username}?start=${cmd}">${name}</a>`
}

const showcategories = (ctx, categories) => {
	return categories.map((e) => {
		let name = ctx.config.categories[e]
		name = name.replace(/^./, name[0].toUpperCase())
		return link(ctx, `categories-${e}`, name)
	})
}

const toIndex = (ctx, type) => {
	if (type == 'languages') {
		return ctx.db.languages.map((e) => {
			return ctx.config.languages.indexOf(e)
		})
	}
	return ctx.session.list[type].map((e) => {
		return ctx.config[type].indexOf(e)
	})
}

const change = (ctx, type) => {
	const key = ctx.match[3]
	ctx.session.list.page = 0
	if (ctx.session.list[type].length == ctx.config[type].length) {
		ctx.session.list[type] = []
	}
	if (ctx.session.list[type].includes(key)) {
		ctx.session.list[type] = ctx.session.list[type].filter(e => e != key)
	} else if (ctx.config[type].includes(key)){ //Anti-hack
		ctx.session.list[type].push(key)
	}
	return ctx
}

const showOptions = (ctx, type) => {
	if (ctx.session.list.categories.length <= 0) {
		ctx.session.list.categories = ctx.config.categories
	}
	if (ctx.session.list.types.length <= 0) {
		ctx.session.list.types = ctx.config.types
	}
	let keys = ctx.config[type].map((el) => {
		return [{
			text: `${
				status(ctx.session.list[type].includes(el))
			} ${
				el.replace(/^./, el[0].toUpperCase())
			}`,
			callback_data: `list:${type}:${el}`
		}]
	})
	keys = keys.reduce((total, next, index) => {
		if (total[total.length - 1].length >= 3) {
			total.push([])
		}
		total[total.length - 1].push(next[0])
		return total
	}, [[]])
	return [
		[{ text: '📝 List', callback_data: 'list' }],
		...keys
	]
}

const base = async (ctx) => {
	let edit = true
	if (!ctx.session.list) {
		ctx.session.list = {
			page: 0,
			order: 'new',
			database: 'bots',
			categories: ctx.config.categories,
			types: ctx.config.types,
		}
	}

	if (ctx.match[2] == 'bots') {
		ctx.session.list.database = 'bots'
		ctx.session.list.types = ctx.config.types
	} else if (ctx.match[2] == 'channels') {
		ctx.session.list.database = 'channels'
		ctx.session.list.types = [ctx.config.types[0]]
	} else if (ctx.match[1] == 'cat' && ctx.match[2]) {
		ctx.session.list.categories = [ctx.config.categories[Number(ctx.match[2])]]
	} else if (ctx.match[2] == 'order' && ctx.match[3]) {
		ctx.session.list.order = ctx.match[3]
	} else if (ctx.match[2] == 'back') {
		ctx.session.list.page--
		edit = false
	} else if (ctx.match[2] == 'next') {
		ctx.session.list.page++
		edit = false
	} else if (ctx.match[2] == 'home') {
		edit = false
		ctx.session.list.page = 0
	}
	if (ctx.session.list.page < 0) {
		ctx.session.list.page = 0
	}
	if (ctx.match[2] == 'search') {
		if (ctx.match[3]) {
			ctx.session.search = false
		} else {
			ctx.session.list.page = 0
			ctx.session.search = true
			return ctx.replyWithHTML('<b>Name: (reply msg)</b>', {
				reply_markup: {
					force_reply: true
				}
			})
		}
	}

	if (typeof ctx.session.search == 'boolean' && ctx.session.search) {
		ctx.session.search = ctx.match[1] || ''
	}

	let db = []
	if (typeof ctx.session.search == 'string') {
		db = await ctx.database.search(ctx.session.search, ctx.session.list.database)
	} else {
		db = await ctx.database.selectWithFilter(
			toIndex(ctx, 'categories'),
			toIndex(ctx, 'types'),
			toIndex(ctx, 'languages'),
			ctx.session.list.page,
			orders.find(e => e.id == ctx.session.list.order).query,
			ctx.session.list.database
		)
	}

	let nodb = 'No results found!'
	if (ctx.session.list.page > 0) {
		nodb += ' (Go back to home page)'
	}
	let text = db.reduce((total, bot, index) => {
		let view = `
${index+1 + (ctx.session.list.page * 3)}. ${bot.name} (${link(ctx, bot.username, 'view')})
⭐️ ${bot.score} | 👥 ${Object.keys(bot.scores).length} | (${link(ctx, `report-${databases[ctx.session.list.database]}${bot.id}`, 'Report')})
🔖 ${showcategories(ctx, bot.categories).join(' | ')}
@${bot.username} -  ${bot.description}
		`
		if (index == 0) {
			return view
		}
		return total + view
	}, nodb)

	let keyboard = [
		[
			{text: '◀️ Back' , callback_data: 'list:back'},
			{text: '🔼 Home' , callback_data: 'list:home'},
			{text: '▶️ Next' , callback_data: 'list:next'}
		],
		[
			{text: `⚙️ Categories${
				ctx.session.list.categories.length <= 2 ? ` (${
					ctx.session.list.categories.map((e) => {
						return e.replace(/^./, e[0].toUpperCase())
					}).join(' & ')
				})` : (ctx.session.list.categories.length == ctx.config.categories.length ? ' (All)' : '')
			}`, callback_data: 'list:categories'},
			{text: `📈 Order (${orders.find(e => e.id == ctx.session.list.order).name})`, callback_data: 'list:order'}
		],
		[
			{text: `⚖️ Advanced Filter`, callback_data: 'list:types'},
			{text: '🔎 Search', callback_data: 'list:search'},
			{text: '📜 Menu' , callback_data: 'menu'}
		]
	]

	const select = '<b>Select:</b>'
	if (ctx.match[2] == 'categories') {
		text = select
		if (ctx.match[3]) {
			ctx = change(ctx, 'categories')
		}
		keyboard = showOptions(ctx, 'categories')
	} else if (ctx.match[2] == 'order' && !ctx.match[3]) {
		text = select
		keyboard = orders.map((el) => {
			return [{
				text: `${el.name}`,
				callback_data: `list:order:${el.id}`
			}]
		})
	} else if (ctx.match[2] == 'types') {
		if (ctx.session.database == 'channels') {
			ctx.answerCbQuery('Only on Bots!', true)
		} else {
			text = select
			if (ctx.match[3]) {
				ctx = change(ctx, 'types')
			}
			keyboard = showOptions(ctx, 'types')
		}
	}

	if (ctx.session.search) {
		keyboard.push([{text: '❌ Close Search' , callback_data: 'list:search:end'}])
	}

	if (ctx.updateType == 'callback_query') {
		if (edit) {
			return ctx.editMessageText(text + ctx.fixKeyboard, {
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: keyboard
				},
				disable_web_page_preview: true
			})
		} else {
			ctx.editMessageText(ctx.update.callback_query.message.text, {
				parse_mode: 'HTML',
				disable_web_page_preview: true
			})
		}
	}
	return ctx.replyWithHTML(text + ctx.fixKeyboard, {
		reply_markup: {
			inline_keyboard: keyboard
		},
		disable_web_page_preview: true
	})
}

const baseWithReply = async (ctx) => {
	if (ctx.session.search) {
		return await base(ctx)
	}
}

module.exports = {
	id: 'list',
	callback: base,
	plugin: base,
	reply: baseWithReply,
	regex: [
		/^\/(cat)egories\s(\d*)$/i,
		/^\/list/i
	]
}
