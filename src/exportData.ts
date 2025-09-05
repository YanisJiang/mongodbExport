import { MongoClient, Collection, Document } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import { config } from './config';
import { ObjectId, Decimal128, Binary, Timestamp } from 'mongodb';

// MongoDB特殊类型映射
const mongoTypeMap = new Map<any, string>();
mongoTypeMap.set(ObjectId, 'ObjectId');
mongoTypeMap.set(Decimal128, 'number');
mongoTypeMap.set(Binary, 'Binary');
mongoTypeMap.set(Timestamp, 'Timestamp');

// 获取值的类型
function getType(value: any): string {
    if (value === null) {
        return 'null';
    }
    if (typeof value === 'object') {
        for (const [mongoType, typeName] of mongoTypeMap.entries()) {
            if (value instanceof mongoType) {
                return typeName;
            }
        }
    }
    if (Array.isArray(value)) {
        // 递归处理数组元素类型
        const uniqueTypes = new Set<string>();
        for (const item of value) {
            uniqueTypes.add(getType(item));
        }
        if (uniqueTypes.size === 0) {
            return 'any[]';
        } else if (uniqueTypes.size === 1) {
            return `${Array.from(uniqueTypes)[0]}[]`;
        } else {
            return `(${Array.from(uniqueTypes).join(' | ')})[]`;
        }
    }
    return typeof value;
}

// 集合的ID字段映射
const idFieldMap: { [key: string]: string } = {
    tile: 'tile_id',
    statusDeprecated: 'statusID',
    craftFormula: 'formulaID',
    item: 'id'
};

// 生成接口定义
export function generateInterface(collectionName: string, documents: Document[]): Record<string, string> {
    const fieldTypes: Record<string, string> = {};
    
    // 收集所有文档中的字段类型
    for (const doc of documents) {
        for (const [key, value] of Object.entries(doc)) {
            if (key === '_id') continue;
            const type = getType(value);
            if (!fieldTypes[key]) {
                fieldTypes[key] = type;
            } else if (type === 'null') {
                // 如果当前值是null，将类型标记为可空
                if (!fieldTypes[key].includes('null')) {
                    fieldTypes[key] = `${fieldTypes[key]} | null`;
                }
            } else if (!fieldTypes[key].includes(type)) {
                // 如果当前值不是null，且类型不在已有类型中，添加新类型
                fieldTypes[key] = `${fieldTypes[key]} | ${type}`;
            }
        }
    }

    return fieldTypes;
}

// 导出集合数据
export async function exportCollection(
    collection: Collection,
    collectionName: string,
    fieldTypes: Record<string, string>
) {
    const documents = await collection.find({}).toArray();
    const interfaceName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
    
    // 使用配置中的输出目录
    const outputDir = config.output.directory;
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // 生成接口定义字符串
    const interfaceFields = Object.entries(fieldTypes)
        .map(([key, typeStr]) => `    ${key}: ${typeStr};`)
        .join('\n');
    const interfaceDef = `export interface ${interfaceName} {\n${interfaceFields}\n}`;

    // 生成数据对象
    const entries = documents.map(doc => {
        const id = doc.id;
        const data = {
            ...doc,
        } as Record<string, any>;
        delete data._id;
        return [Number(id), data];
    });

    const dataObj = `export const ${collectionName}: Record<number, ${interfaceName}> = {\n${entries.map(([id, data]) => {
        const dataStr = Object.entries(data)
            .map(([key, value]) => {
                const valueStr = typeof value === 'string' ? `"${value}"` : value;
                return `        ${key}: ${valueStr}`;
            })
            .join(',\n');
        return `    ${id}: {\n${dataStr}\n    }`;
    }).join(',\n')}\n};\n`;

    // 组合接口定义和数据导出代码
    const exportCode = `${interfaceDef}\n\n${dataObj}`;

    // 将集合名转换为帕斯卡命名法
    const pascalCaseName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);

    // 写入文件
    const outputPath = path.join(outputDir, `${pascalCaseName}.ts`);
    fs.writeFileSync(outputPath, exportCode);
    console.log(`Exported ${collectionName} to ${outputPath}`);
}