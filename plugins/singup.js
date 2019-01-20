const types = {
	'username': 'Username (examplebot):',
	'name': 'Name (Example Bot):',
	'description': 'Description (Search example in examples):',
	'categories': 'Categories (Max 3):',
	'types': 'Types:'
}

const status = (key) => {
	if (key) {
		return '✅'
	}
	return '❌'
}

const keyboard = (list, db) => {
	const keys = list.map((el) => {
		return [{
			text: `${status(db[el])} ${el.replace(/^./, el[0].toUpperCase())}`,
			callback_data: `singup:${cat}`
		}]
	})
	return [
		[{ text: `singup:next` }],
		...keys
	]
}

const reply = async (ctx) => {
	if (!ctx.session.singup || !ctx.session.singup.type) {
		return
	}

	const input = ctx.match[1].replace(/@/g, '')
	let type = ctx.session.singup.type
	let text = ''
	let reply_markup = {
		force_reply: true
	}

	if (ctx.updateType != 'callback_query') {
		//TODO Valid via regex
		ctx.session.singup.db[type] = input

		const keyTypes = Object.keys(types)
		const nextType = keyTypes.indexOf(type) + 1
		ctx.session.singup.type = nextType >= keyTypes.length ? 'end' : keyTypes[nextType]
		type = ctx.session.singup.type
	}

	if (type == 'categories') {
		if (ctx.match[2] == 'next') {
			//TODO Valid
			return
		} else if (ctx.config.categories.includes(ctx.match[2])) { //Anti Hack
			ctx.session.singup.db.categories[ctx.match[2]] = ctx.session.singup.db.categories[ctx.match[2]] ? false : true
		}
		reply_markup = {
			inline_keyboard: keyboard(
				ctx.config.categories,
				ctx.session.singup.db.categories
			)
		}
	}
	//TODO type menu

	return ctx.replyWithHTML(`<b>${types[ctx.session.singup.type]}</b>`, {
		reply_markup: reply_markup
	})
}

const base = async (ctx) => {
	ctx.session.singup = {
		type: 'username',
		db: {
			categories: {},
			types: {}
		}
	}

	ctx.config.categories.forEach((el) => {
		ctx.session.singup.categories[el] = false
	})
	ctx.config.types.forEach((el) => {
		ctx.session.singup.types[el] = false
	})

	return ctx.replyWithHTML(`<b>${types[ctx.session.singup.type]}</b>`, {
		reply_markup: {
			force_reply: true
		}
	})
}

module.exports = {
	id: 'singup',
	plugin: base,
	callback: base,
	reply: reply,
	regex: [
		/^\/start/i
	]
}
