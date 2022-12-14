const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg, metadata) => {
    const chatId = msg.chat.id;

    switch (msg.text) {
        case '/start':
            bot.sendMessage(chatId, 'Кнопащке', {
                reply_markup: {
                    inline_keyboard: [
                        {
                            text: "Залогиниться как походник",
                            callback_data: "login",
                        },
                        {
                            text: "Когда поход?",
                            callback_data: "when_hike",
                        },
                    ]
                }
            });
    }

    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, JSON.stringify({msg, metadata}, null, ' '));
});

bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
    };
    let text;

    if (action === '1') {
        text = 'You hit button 1';
    }

    bot.sendMessage(msg.chat.id, JSON.stringify({msg, action}, null, ' '));
});
