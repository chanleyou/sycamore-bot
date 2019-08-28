"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
exports.MESSAGE_DELETE_TIMEOUT = moment_1.default.duration(36, 'hours');
exports.CLEAR_INTERVAL = moment_1.default.duration(1, 'hour');
//# sourceMappingURL=constants.js.map