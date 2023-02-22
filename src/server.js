const {Telegraf} = require('telegraf');

require('dotenv').config();


const bot = new Telegraf(process.env.TELEGRAM_TOKEN);




bot.launch();
