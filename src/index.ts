import { MongoClient } from 'mongodb';
import { config } from './config';
import { exportCollection, generateInterface } from './exportData';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    // 清空输出目录
    const outputDir = config.output.directory;
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    } else {
        // 清空输出目录中的所有文件，忽略 .meta 文件
        const files = fs.readdirSync(outputDir);
        for (const file of files) {
            if (!file.endsWith('.meta')) {
                fs.unlinkSync(path.join(outputDir, file));
            }
        }
    }

    const client = new MongoClient(config.mongodb.uri, config.mongodb.options);

    try {
        await client.connect();
        console.log('Successfully connected to MongoDB.');
        
        const db = client.db(config.mongodb.database);
        console.log(`Connected to database: ${config.mongodb.database}`);
        
        // 获取所有集合
        const collections = await db.listCollections().toArray();
        
        // 为每个集合生成导出
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`Processing collection: ${collectionName}`);
            
            const coll = db.collection(collectionName);
            const documents = await coll.find({}).toArray();
            
            // 生成接口定义
            const fieldTypes = generateInterface(collectionName, documents);
            
            // 导出集合数据
            await exportCollection(coll, collectionName, fieldTypes);
        }
        
        console.log('All collections have been exported successfully!');
    } catch (error) {
        console.error('Error during export:', error);
    } finally {
        await client.close();
    }
}

main().catch(console.error); 