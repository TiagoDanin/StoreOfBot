const Telegraf = require('telegraf')
const telegrafStart = require('telegraf-start-parts')
const debug = require('debug')
const stringify = require('json-stringify-safe')
const { Resources, Translation } = require('nodejs-i18n')
const session = require('telegraf/session')

const config = require('./config')
const database = require('./database')

const bot = new Telegraf(process.env.telegram_token, {
	username: 'StoreOfBot'
})
const dlogBot = debug('bot')
const dlogPlugins = debug('bot:plugins')
const dlogReply = debug('bot:reply')
const dLogForward = debug('bot:forward')
const dlogInline = debug('bot:inline')
const dlogCallback = debug('bot:callback')
const dlogError = debug('bot:error')

dlogBot("Start bot")
let startLog = `
#Start
<b>BOT START</b>
<b>Username:</b> @StoreOfBot
`
bot.telegram.sendMessage(config.ids.log,
	startLog, {
		parse_mode: 'HTML'
	}
)

const processError = (error, ctx, plugin) => {
	if (error) {
		if (`${error}`.match('400: Bad Request: message is not modified')) {
			return ctx.answerCbQuery('You have already selected is option!', true).catch((e) => {
				return dlogError(e)
			})
		} else if (`${error}`.match('Error: 403: Forbidden: bot was blocked by the user')) {
			return true //TODO FIx
		}
	}

	var fulllog = []
	var logId = `${+ new Date()}_`
	if (ctx && ctx.update && ctx.update.update_id) {
		logId += `${ctx.update.update_id}`
	} else {
		logId += 'NoUpdate'
	}

	var errorMsg = 'ERROR'
	if (ctx && ctx._) {
		errorMsg = ctx._('ERROR')
	}
	errorMsg += ` \`ID:${logId}\``

	if (ctx && ctx.updateType) {
		if (ctx.updateType == 'message') {
			ctx.replyWithMarkdown(errorMsg)
		} else if (ctx.updateType == 'callback_query' || ctx.updateType == 'edited_message') {
			ctx.reply(errorMsg, { //editMessageText
				parse_mode: 'Markdown'
			})
		} else if (ctx.updateType == '') {
			ctx.answerCbQuery(
				errorMsg.replace(/\*/g, '').replace(/`/g, ''),
				true
			)
		}
	}

	if (error) {
		fulllog.push({
			type: 'error',
			data: error
		})
		dlogError(`Oooops`, error)
	}
	if (ctx) {
		fulllog.push({
			type: 'ctx',
			data: ctx
		})
	}
	if (plugin) {
		fulllog.push({
			type: 'plugin',
			data: plugin
		})
	}

	var clearUser = (user) => JSON.stringify(user).replace(/[{"}]/g, '').replace(/,/g, '\n').replace(/:/g, ': ')

	var text = `#Error ID:${logId}`
	if (plugin && plugin.id) {
		text += `\nPlugin ~> ${plugin.id}`
	}
	if (error) {
		text += `\nERROR ~>\n${error.toString()}\n`
	}
	if (ctx && ctx.from) {
		text += `\nFROM ~>\n${clearUser(ctx.from)}\n`
	}
	if (ctx && ctx.chat) {
		text += `\nCHAT ~>\n${clearUser(ctx.chat)}`
	}

	bot.telegram.sendMessage(config.ids.log, text.substring(0, 4000))

	var jsonData = stringify(fulllog)
	var remove = (name) => {
		jsonData = jsonData.replace(new RegExp(name, 'gi'), 'OPS_SECRET')
	}

	[
		process.env.telegram_token
		//add more...
	].forEach(name => remove(name))

	return bot.telegram.sendDocument(
		config.ids.log,
		{
			filename: `${logId}.log.JSON`,
			source: Buffer.from(jsonData, 'utf8')
		}
	)
}

let inline = []
let callback = []
let reply = []
let forward = []

bot.use((ctx, next) => telegrafStart(ctx, next))
bot.use(session({
	getSessionKey: (ctx) => {
		return ctx.from.id
	}
}))

const r = new Resources({
	lang: config.defaultLang
})
config.locales.forEach((id) => {
	r.load(id, `locales/${id}.po`)
})

const checkLanguage = (ctx) => {
	let language = config.defaultLang
	const types = [
		'message',
		'edited_message',
		'callback_query',
		'inline_query'
	]
	let type = types.find((t) => ctx.update[t])
	if (type && ctx.update[type] && ctx.update[type].from && ctx.update[type].from.language_code) {
		language = ctx.update[type].from.language_code.substr(0, 2)
	}
	if (!locales.includes(language)) {
		language = config.defaultLang
	}
	return language
}

bot.use((ctx, next) => {
	var langCode = checkLanguage(ctx)
	var i18n = new Translation(langCode)
	ctx._ = i18n._.bind(i18n)
	ctx.langCode = langCode
	return next(ctx)
})

bot.context.database = database
bot.context.config = config
bot.context.fixKeyboard = ''//Array(90).join('\u0020') + '\u200B'

bot.use((ctx, next) => {
	ctx.privilege = 0
	if (config.ids.admins.includes(ctx.from.id)) {
		ctx.privilege = 7
	} else if (config.ids.mods.includes(ctx.from.id)) {
		ctx.privilege = 5
	}
	return next(ctx)
})

bot.use(async (ctx, next) => {
	ctx.db = await ctx.database.select({
		id: ctx.from.id
	}, 'users')
	if (!ctx.db || ctx.db <= 0) {
		ctx.db = await ctx.database.insert({
			id: ctx.from.id
		}, 'users')
	} else {
		ctx.db = ctx.db[0]
	}
	return next(ctx)
})

config.plugins.forEach(p => {
	var _ = require(`./plugins/${p}`)
	dlogBot(`Install plugin: ${_.id}`)

	if (_.install) {
		try {
			_.install()
		} catch (e) {
			processError(e, false, _)
		}
	}

	if (_.plugin) {
		bot.hears(_.regex, async (ctx) => {
			dlogPlugins(`Runnig cmd plugin: ${_.id}`)
			try {
				await _.plugin(ctx)
			} catch (e) {
				processError(e, ctx, _)
			}
		})
	}

	if (_.inline) {
		inline.push(_)
	}

	if (_.callback) {
		callback.push(_)
	}

	if (_.reply) {
		reply.push(_)
	}

	if (_.forward) {
		forward.push(_)
	}
})

bot.on('new_chat_members', async (ctx) => {
	let msg = ctx.message

	if (ctx.session.search) {
		ctx.session.search = false
	}

	if (msg.new_chat_participant.id == 620082476 && msg.chat.username) {
		ctx.session.singup = {
			type: 'description',
			database: 'groups',
			update: false,
			db: {
				id: Math.abs(msg.chat.id),
				name: msg.chat.title.replace(/[<>\[\]\(\)\*#@]/g, ''),
				username: msg.chat.username,
				description: '',
				admin: msg.from.id,
				languages: {},
				categories: {},
				types: [0]
			}
		}

		let db = await ctx.database.select({
			id: Math.abs(msg.chat.id)
		}, ctx.session.singup.database)
		if (db.length != 0) {
			ctx.session.singup.update = true
		}

		ctx.config.categories.forEach((el) => {
			ctx.session.singup.db.categories[el] = false
		})
		ctx.config.types.forEach((el) => {
			ctx.session.singup.db.types[el] = false
		})

		ctx.replyWithMarkdown('*I have sent you the requested information in a private message.*')
		return bot.telegram.sendMessage(msg.from.id, '*Description: (reply msg)*', {
			parse_mode: 'Markdown',
			reply_markup: {
				force_reply: true
			}
		})
	}
})

bot.on('message', async (ctx) => {
	var msg = ctx.message
	if (msg.reply_to_message && msg.reply_to_message.text && msg.text) {
		for (var _ of reply) {
			dlogReply(`Runnig Reply plugin: ${_.id}`)
			ctx.match = [
				msg.reply_to_message.text,
				msg.text
			]
			try {
				await _.reply(ctx)
			} catch (e) {
				processError(e, ctx, _)
			}
		}
	} else if (msg.forward_from || msg.forward_from_chat) {
		for (var _ of forward) {
			dLogForward(`Runnig Forward plugin: ${_.id}`)
			ctx.forward = msg.forward_from || msg.forward_from_chat
			try {
				await _.forward(ctx)
			} catch (e) {
				processError(e, ctx, _)
			}
		}
	}
})

bot.on('callback_query', async (ctx) => {
	if (ctx.update && ctx.update.callback_query && ctx.update.callback_query.data) {
		var data = ctx.update.callback_query.data
		for (var _ of callback) {
			if (data.startsWith(_.id)) {
				ctx.match = [].concat(data, data.split(':'))
				dlogCallback(`Runnig callback plugin: ${_.id}`)
				try {
					await _.callback(ctx)
				} catch (e) {
					processError(e, ctx, _)
				}
			}
		}
	}
})

bot.catch((err) => {
	try {
		processError(err, false, false)
	} catch (e) {
		dlogError(`Oooops ${err}`)
		dlogError(`OH!!! ${e}`)
	}
})

bot.launch()
