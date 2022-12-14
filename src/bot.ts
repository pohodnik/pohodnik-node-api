import {Commands} from "./enums/Commands";
import {StartAnswers} from "./enums/StartAnswers";

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
     bot.sendMessage(chatId, resp);
});

bot.on('message', (msg, metadata) => {
    const chatId = msg.chat.id;

    switch (msg.text) {
        case Commands.Start:
            bot.sendMessage(chatId, 'Кнопащке', {
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: "Залогиниться как походник",
                            callback_data: StartAnswers.Login,
                        }],
                        [{
                            text: "Когда поход?",
                            callback_data: StartAnswers.WhenHike,
                        }],
                    ]
                }
            });
            break;
        default:
            bot.sendMessage(chatId, 'Лучше попробуй команду /start \n\n\n' + JSON.stringify({msg, metadata}, null, ' '));
    }

    // send a message to the chat acknowledging receipt of their message

});

bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
    };
    let text;

    switch (action) {
        case StartAnswers.Login:
            bot.sendMessage(msg.chat.id, "Пока не готово... 😎, но можно просто на сейте залогиниться, если очень хочется https://pohodnik.tk/login ");
            break;
        case StartAnswers.WhenHike:
            bot.sendMessage(msg.chat.id, "Скоро 😊");
            break;
        default:
            bot.sendMessage(msg.chat.id, JSON.stringify({msg, action}, null, ' '));
    }
});
