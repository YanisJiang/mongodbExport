"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const config_1 = require("./config");
const exportData_1 = require("./exportData");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function main() {
    // 清空输出目录
    const outputDir = config_1.config.output.directory;
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    else {
        // 清空输出目录中的所有文件，忽略 .meta 文件
        const files = fs.readdirSync(outputDir);
        for (const file of files) {
            if (!file.endsWith('.meta')) {
                fs.unlinkSync(path.join(outputDir, file));
            }
        }
    }
    const client = new mongodb_1.MongoClient(config_1.config.mongodb.uri, config_1.config.mongodb.options);
    try {
        await client.connect();
        console.log('Successfully connected to MongoDB.');
        const db = client.db(config_1.config.mongodb.database);
        console.log(`Connected to database: ${config_1.config.mongodb.database}`);
        // 获取所有集合
        const collections = await db.listCollections().toArray();
        // 为每个集合生成导出
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`Processing collection: ${collectionName}`);
            const coll = db.collection(collectionName);
            const documents = await coll.find({}).toArray();
            // 生成接口定义
            const fieldTypes = (0, exportData_1.generateInterface)(collectionName, documents);
            // 导出集合数据
            await (0, exportData_1.exportCollection)(coll, collectionName, fieldTypes);
        }
        console.log('All collections have been exported successfully!');
    }
    catch (error) {
        console.error('Error during export:', error);
    }
    finally {
        await client.close();
    }
}
main().catch(console.error);
