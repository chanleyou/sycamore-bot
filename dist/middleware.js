"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const cache_1 = __importDefault(require("./cache"));
exports.recordMiddleware = (ctx, next) => {
    const { message, chat } = ctx;
    const { message_id } = message;
    const { id: chat_id } = chat;
    const timestamp = moment_1.default().toISOString();
    cache_1.default.rpush('store', [message_id, chat_id, timestamp].join(','));
    next();
};
exports.replyMiddleware = (ctx, next) => {
    const { reply } = ctx;
    if (reply == null) {
        return next();
    }
    const originalReply = ctx.reply.bind(ctx);
    ctx.reply = function (...input) {
        originalReply(...input).then(({ message_id, chat }) => {
            const { id: chat_id } = chat;
            const timestamp = moment_1.default().toISOString();
            cache_1.default.rpush('store', [message_id, chat_id, timestamp].join(','));
        });
    };
    return next();
};
//# sourceMappingURL=middleware.js.map