"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const _1 = require(".");
const constants_1 = require("./constants");
const cache_1 = __importDefault(require("./cache"));
exports.clearChatMessages = (ctx) => {
    const { message, chat } = ctx;
    const { id } = chat;
    let length;
    cache_1.default.llen('store', (e, len) => {
        if (e)
            return;
        length = len;
    });
    const toRemove = [];
    for (let i = 0; i < length; i++) {
        cache_1.default.lindex('store', i, (e, message) => {
            if (e) {
                console.log(e);
                return;
            }
            const [message_id, chat_id] = message.split(',');
            if (chat_id === id.toString()) {
                _1.telegram.deleteMessage(chat_id, message_id);
                toRemove.push(message);
            }
        });
    }
    toRemove.forEach(message => cache_1.default.lrem('store', 1, message));
};
exports.deleteOldMessages = () => {
    ;
    () => {
        const now = moment_1.default();
        let done = false;
        while (done === false) {
            cache_1.default.llen('store', (e, len) => {
                if (len === 0) {
                    return;
                }
            });
            cache_1.default.lpop('store', (e, message) => {
                if (e) {
                    console.log(`Error: ${e}`);
                    return;
                }
                const [message_id, chat_id, timestamp] = message.split(',');
                if (moment_1.default(timestamp)
                    .add(constants_1.MESSAGE_DELETE_TIMEOUT)
                    .isBefore(now)) {
                    _1.telegram.deleteMessage(chat_id, message_id);
                }
                else {
                    cache_1.default.lpush('store', message);
                    done = true;
                }
            });
        }
    };
};
exports.report = (ctx) => {
    const { message, reply } = ctx;
    const { id } = message.from;
    if (id.toString() !== process.env.ADMIN_ID) {
        reply('Sorry, only the big boss can use this command.', {
            reply_to_message_id: message.message_id,
        });
        return;
    }
    cache_1.default.llen('store', (e, len) => {
        reply(`${len} ${len === 1 ? 'message' : 'messages'} cached.`, {
            reply_to_message_id: message.message_id,
        });
    });
};
exports.instructions = (ctx) => {
    ctx.reply(`Hello! Sycamore Safety Bot automatically deletes messages (but not pictures, videos, etc.) older than ${constants_1.MESSAGE_DELETE_TIMEOUT.humanize()} every ${constants_1.CLEAR_INTERVAL.humanize(true)}. Alternatively, you can type /clear to delete all messages immediately. The bot requires admin permissions to delete messages in group chats.`);
};
//# sourceMappingURL=functions.js.map