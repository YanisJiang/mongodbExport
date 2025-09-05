"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// 加载 .env 文件
dotenv_1.default.config();
exports.config = {
    mongodb: {
        username: 'root',
        password: "p9-A&9~x9'7'3nWVuGRa",
        host: '123.57.241.90:27017',
        database: 'package_sunshine',
        get uri() {
            return `mongodb://${this.username}:${this.password}@${this.host}/${this.database}?authSource=admin`;
        },
        options: {}
    },
    output: {
        // 使用指定的绝对路径
        directory: 'E:\\CocosCreator\\dev_package\\Sunshine_Listen_FullStack\\frontend\\assets\\scripts\\db'
    }
};
