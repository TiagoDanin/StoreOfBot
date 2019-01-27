const Telegraf = require('telegraf')

const types = {
	//'name': 'Name (Example Bot):',
	//'username': 'Username (examplebot):',
	'token': 'Send the bot token to confirm:', //TODO MSG UPDATE
	'description': 'Description:',
	'categories': 'Categories (Max 3):',
	'types': 'Types:'
}

const testToken = async (token) => {
	const bot = new Telegraf(token)
	return await bot.telegram.getMe().catch(() => false)
}

const status = (key) => key ? '✅' : '❌'

const keyboard = (list, db) => {
	const keys = list.map((el) => {
		return [{
			text: `${status(db[el])} ${el.replace(/^./, el[0].toUpperCase())}`,
			callback_data: `singup:${el}`
		}]
	})
	return [
		[{ text: '👍 Next', callback_data: 'singup:next' }],
		...keys
	]
}

const getValues = (list, db) => {
	if (Array.isArray(db)) {
		return db
	}
	let values = []
	Object.keys(db).forEach((el) => {
		if (db[el]) {
			values.push(
				list.indexOf(el)
			)
		}
	})
	return values
}

const base = async (ctx) => {
	if (!ctx.session.singup || !ctx.session.singup.type) {
		return
	}

	let input = ctx.match[1].replace(/@/g, '')
	let type = ctx.session.singup.type
	let reply_markup = {
		force_reply: true
	}

	if ((ctx.match[2] == 'next' && ctx.updateType == 'callback_query') || ctx.updateType != 'callback_query') {
		if (ctx.match[2] == 'next') {
			if (type == 'categories') {
				input = getValues(
					ctx.config.categories,
					ctx.session.singup.db.categories
				)
				if (input.length > 3 || input.length <= 0) {
					return ctx.answerCbQuery('Select 1-3 categories!', true)
				}
			} else if (type == 'types') {
				input = getValues(
					ctx.config.types,
					ctx.session.singup.db.types
				)
				if (input.length <= 0) {
					return ctx.answerCbQuery('Select an option!', true)
				}
			}
		}
		if (typeof input == 'string') {
			if (!input.match(/^([a-zA-Z0-9\s!çÇ&:-_]{12,160})$/g)) {
				return ctx.replyWithHTML(`
<b>Text must have only letter and number with 12-160 characters!</b>
${types[ctx.session.singup.type]}
					`, {
					reply_markup: reply_markup
				})
			}
		}
		if (type == 'token') {
			const bot = await testToken(input)
			if (!bot || bot.id != ctx.session.singup.db.id) {
				return ctx.replyWithHTML(`
<b>Token invalid!</b>
${types[ctx.session.singup.type]}
					`, {
					reply_markup: reply_markup
				})
			}
		} else {
			ctx.session.singup.db[type] = input
		}

		const keyTypes = Object.keys(types)
		const nextType = keyTypes.indexOf(type) + 1
		ctx.session.singup.type = nextType >= keyTypes.length ? 'end' : keyTypes[nextType]
		type = ctx.session.singup.type
	}

	let showKeyboard = false
	if (['categories', 'types'].includes(type)) {
		showKeyboard = type
	}

	if (showKeyboard) {
		if (ctx.config[showKeyboard].includes(ctx.match[2])) { //Anti Hack
			ctx.session.singup.db[showKeyboard][ctx.match[2]] = ctx.session.singup.db[showKeyboard][ctx.match[2]] ? false : true
		}
		reply_markup = {
			inline_keyboard: keyboard(
				ctx.config[showKeyboard],
				ctx.session.singup.db[showKeyboard]
			)
		}
	}

	let text = `
<b>Name:</b> ${ctx.session.singup.db.name}
<b>Username:</b> ${ctx.session.singup.db.username}
<b>Description:</b> ${ctx.session.singup.db.description}
<b>Categories:</b> ${
	getValues(
		ctx.config.categories,
		ctx.session.singup.db.categories
	).map(e => ctx.config.categories[e]).join(', ')
}
<b>Types:</b> ${
	getValues(
		ctx.config.types,
		ctx.session.singup.db.types
	).map(e => ctx.config.types[e]).join(', ')
}\n\n`

	if (type == 'end') {
		reply_markup = {
			inline_keyboard: [[
				{text: 'Done!', callback_data: 'menu'}
			]]
		}
		if (ctx.session.singup.update) {
			await ctx.database.update(ctx.session.singup.db)
		} else {
			await ctx.database.insert(ctx.session.singup.db)
		}
		text += `Done!, your link: https://telegram.me/${ctx.options.username}?start=${ctx.session.singup.db.username}`
		ctx.session.singup = {} //Reset
	} else {
		text += `📌 <b>${types[ctx.session.singup.type]}</b>`
	}
	text += `${ctx.fixKeyboard}`

	if (ctx.updateType == 'callback_query') {
		return ctx.editMessageText(text, {
			parse_mode: 'HTML',
			reply_markup: reply_markup
		})
	}
	return ctx.replyWithHTML(text, {
		reply_markup: reply_markup
	})
}

const start = async (ctx) => {
	if (!ctx.forward.is_bot) {
		return ctx.replyWithMarkdown('This not is an bot!')
	}

	ctx.session.singup = {
		type: 'description',
		update: false,
		db: {
			id: ctx.forward.id,
			name: ctx.forward.first_name,
			username: ctx.forward.username,
			description: '', //TODO Use mtproto
			admin: ctx.from.id,
			categories: {},
			types: {}
		}
	}

	let bots = await ctx.database.select({id: ctx.forward.id})
	if (bots.length != 0) {
		if (bots[0].admin != ctx.from.id) {
			ctx.session.singup.type = 'token'
		}
		ctx.session.singup.update = true
	}

	ctx.config.categories.forEach((el) => {
		ctx.session.singup.db.categories[el] = false
	})
	ctx.config.types.forEach((el) => {
		ctx.session.singup.db.types[el] = false
	})

	return ctx.replyWithHTML(`<b>${types[ctx.session.singup.type]}</b>`, {
		reply_markup: {
			force_reply: true
		}
	})
}

const info = (ctx) => {
	return ctx.replyWithMarkdown('*Forward a message* from your bot in my private!')
}

module.exports = {
	id: 'singup',
	callback: base,
	reply: base,
	forward: start,
	plugin: info,
	regex: [
		/^\/singup/i,
		/^\/add/i
	]
}
