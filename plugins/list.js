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

const toIndex = (ctx, type) => {
	return ctx.session.list[type].map((e) => {
		return ctx.config[type].indexOf(e)
	})
}

const change = (ctx, type) => {
	const key = ctx.match[3]
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
			order: 'name',
			categories: ctx.config.categories,
			types: [ctx.config.types[0]]
		}
	}

	//orders.find(e => e.id == ctx.match[3]).id
	if (ctx.match[2] == 'orders' && ctx.match[3]) {
		ctx.session.list.order = ctx.match[3]
	} else if (ctx.match[2] == 'back') {
		ctx.session.list.page--
	} else if (ctx.match[2] == 'next') {
		ctx.session.list.page++
	}
	if (ctx.session.list < 0) {
		ctx.session.list = 0
	}

	let bots = await ctx.database.selectWithFilter(
		toIndex(ctx, 'categories'),
		toIndex(ctx, 'types'),
		ctx.session.list.page,
		orders.find(e => e.id == ctx.session.list.order).query
	)

	let text = `
1. Test - Jogos | Filmes | Utilidades
My test bot in Telegram
@TestBot, ⭐️(5.0), 👥(666)
	`
	let keyboard = [
		[
			{text: '◀️ Back' , callback_data: 'list:back'},
			{text: '▶️ Next' , callback_data: 'list:next'}
		],
		[
			{text: `⚙️ Categories`, callback_data: 'list:categories'},
			{text: `📈 Order`, callback_data: 'list:order'}
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
		/^\/start/i
	]
}
