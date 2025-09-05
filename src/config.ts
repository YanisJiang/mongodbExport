import dotenv from 'dotenv';
import { MongoClientOptions } from 'mongodb';
import * as path from 'path';

// 加载 .env 文件
dotenv.config();

export const config = {
    mongodb: {
        username: 'root',
        password: "p9-A&9~x9'7'3nWVuGRa",
        host: '123.57.241.90:27017',
        database: 'package_sunshine',
        get uri() {
            return `mongodb://${this.username}:${this.password}@${this.host}/${this.database}?authSource=admin`;
        },
        options: {} as MongoClientOptions
    },
    output: {
        // 使用指定的绝对路径
        directory: 'E:\\CocosCreator\\dev_package\\Sunshine_Listen_FullStack\\frontend\\assets\\scripts\\db'
    }
}; 