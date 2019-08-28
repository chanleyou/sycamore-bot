"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = __importDefault(require("telegraf"));
const Telegram = require('telegraf/telegram');
const dotenv_1 = __importDefault(require("dotenv"));
const constants_1 = require("./constants");
const middleware_1 = require("./middleware");
const functions_1 = require("./functions");
if (process.env.NODE_ENV === 'development')
    dotenv_1.default.config();
exports.bot = new telegraf_1.default(process.env.API_KEY);
exports.telegram = new Telegram(process.env.API_KEY);
exports.bot.on('message', middleware_1.recordMiddleware);
exports.bot.use(middleware_1.replyMiddleware);
exports.bot.command('clear', functions_1.clearChatMessages);
exports.bot.command('report', functions_1.report);
exports.bot.start(functions_1.instructions);
exports.bot.help(functions_1.instructions);
exports.bot.launch();
setInterval(functions_1.deleteOldMessages, constants_1.CLEAR_INTERVAL.asMilliseconds());
//# sourceMappingURL=index.js.map