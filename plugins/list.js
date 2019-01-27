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

const showcategories = (ctx, categories) => {
	return categories.map((e) => {
		let name = ctx.config.categories[e]
		name = name.replace(/^./, name[0].toUpperCase())
		return `<a href="https://telegram.me/${ctx.options.username}?start=categories-${e}">${name}</a>`
	})
}

const toIndex = (ctx, type) => {
	return ctx.session.list[type].map((e) => {
		return ctx.config[type].indexOf(e)
	})
}

const change = (ctx, type) => {
	const key = ctx.match[3]
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
	const keys = ctx.config[type].map((el) => {
		return [{
			text: `${
				status(ctx.session.list[type].includes(el))
			} ${
				el.replace(/^./, el[0].toUpperCase())
			}`,
			callback_data: `list:${type}:${el}`
		}]
	})
	return [
		[{ text: '📝 List', callback_data: 'list' }],
		...keys
	]
}

const base = async (ctx) => {
	if (!ctx.session.list) {
		ctx.session.list = {
			page: 0,
			order: 'new',
			categories: ctx.config.categories,
			types: [ctx.config.types[0]]
		}
	}

	if (ctx.match[1] == 'cat' && ctx.match[2]) {
		ctx.session.list.categories = [ctx.config.categories[Number(ctx.match[2])]]
	} else if (ctx.match[2] == 'order' && ctx.match[3]) {
		ctx.session.list.order = ctx.match[3]
	} else if (ctx.match[2] == 'back') {
		ctx.session.list.page--
	} else if (ctx.match[2] == 'next') {
		ctx.session.list.page++
	}
	if (ctx.session.list.page < 0) {
		ctx.session.list.page = 0
	}

	let bots = await ctx.database.selectWithFilter(
		toIndex(ctx, 'categories'),
		toIndex(ctx, 'types'),
		ctx.session.list.page,
		orders.find(e => e.id == ctx.session.list.order).query
	)

	let text = bots.reduce((total, bot, index) => {
		let view = `
${index+1 + (ctx.session.list.page * 3)}. ${bot.name} - ⭐️(${bot.score}) | 👥(${Object.keys(bot.scores).length})
@${bot.username} - ${showcategories(ctx, bot.categories).join(' | ')}
${bot.description}
		` //Add click in categories
		if (index == 0) {
			return view
		}
		return total + view
	}, 'Without Bots!')

	let keyboard = [
		[
			{text: '◀️ Back' , callback_data: 'list:back'},
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
			{text: `⚖️ Advanced Filter`, callback_data: 'list:types'}
		],
		[
			{text: '🔎 Search', callback_data: 'search'}
		],
		[
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
		text = select
		if (ctx.match[3]) {
			ctx = change(ctx, 'types')
		}
		keyboard = showOptions(ctx, 'types')
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
	id: 'list',
	callback: base,
	plugin: base,
	regex: [
		/^\/(cat)egories\s(\d*)$/i,
		/^\/list/i
	]
}
