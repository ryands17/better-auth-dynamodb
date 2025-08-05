import {createAdapter} from "better-auth/adapters";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {
    BatchWriteCommand,
    DeleteCommand,
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    ScanCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import type {BetterAuthOptions} from "better-auth";

interface DynamoDBAdapterConfig{
    client?: DynamoDBClient;
    region?: string;
    tablePrefix?: string;
    useSingleTable?: boolean;
    tableName?: string;
}

export const dynamoDBAdapter = (config: DynamoDBAdapterConfig) => {
    // Inicializar o cliente DynamoDB
    const dynamoClient = config.client || new DynamoDBClient({
        region: config.region || "us-east-1"
    });

    const docClient = DynamoDBDocumentClient.from(dynamoClient);

    // Helper para determinar nome da tabela
    const getTableName = (model: string) => {
        if (config.useSingleTable) {
            return config.tableName || "better-auth";
        }
        return `${config.tablePrefix || ""}${model}`;
    };

    // Helper para criar chave composta em single-table design
    const createKeys = (model: string, id: string) => {
        if (config.useSingleTable) {
            return {
                PK: `${model.toUpperCase()}#${id}`,
                SK: `${model.toUpperCase()}#${id}`
            };
        }
        return {id};
    };

    // Helper para construir condições WHERE
    const buildFilterExpression = (where: Record<string, any>) => {
        const expressions: string[] = [];
        const expressionValues: Record<string, any> = {};
        const expressionNames: Record<string, string> = {};

        Object.entries(where).forEach(([key, value], index) => {
            const placeholder = `:val${index}`;
            const namePlaceholder = `#${key}`;

            if (value === null) {
                expressions.push(`attribute_not_exists(${namePlaceholder})`);
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                // Suporte para operadores como gt, lt, etc
                Object.entries(value).forEach(([op, val]) => {
                    switch (op) {
                        case 'gt':
                            expressions.push(`${namePlaceholder} > ${placeholder}`);
                            expressionValues[placeholder] = val;
                            break;
                        case 'lt':
                            expressions.push(`${namePlaceholder} < ${placeholder}`);
                            expressionValues[placeholder] = val;
                            break;
                        case 'gte':
                        case 'ge':
                            expressions.push(`${namePlaceholder} >= ${placeholder}`);
                            expressionValues[placeholder] = val;
                            break;
                        case 'lte':
                        case 'le':
                            expressions.push(`${namePlaceholder} <= ${placeholder}`);
                            expressionValues[placeholder] = val;
                            break;
                        case 'ne':
                            expressions.push(`${namePlaceholder} <> ${placeholder}`);
                            expressionValues[placeholder] = val;
                            break;
                        case 'in':
                            if (Array.isArray(val)) {
                                const inPlaceholders = val.map((_, i) => `:val${index}_${i}`);
                                expressions.push(`${namePlaceholder} IN (${inPlaceholders.join(', ')})`);
                                val.forEach((v, i) => {
                                    expressionValues[`:val${index}_${i}`] = v;
                                });
                            }
                            break;
                        case 'contains':
                            expressions.push(`contains(${namePlaceholder}, ${placeholder})`);
                            expressionValues[placeholder] = val;
                            break;
                        case 'starts_with':
                            expressions.push(`begins_with(${namePlaceholder}, ${placeholder})`);
                            expressionValues[placeholder] = val;
                            break;
                        default:
                            expressions.push(`${namePlaceholder} = ${placeholder}`);
                            expressionValues[placeholder] = val;
                    }
                });
            } else {
                expressions.push(`${namePlaceholder} = ${placeholder}`);
                expressionValues[placeholder] = value;
            }

            expressionNames[namePlaceholder] = key;
        });

        return {
            FilterExpression: expressions.join(' AND '),
            ExpressionAttributeValues: expressionValues,
            ExpressionAttributeNames: expressionNames
        };
    };

    return createAdapter({
        config: {
            adapterId: "dynamodb",
            adapterName: "DynamoDB",
            supportsNumericIds: false,
            supportsJSON: true,
            supportsDates: false,
            supportsBooleans: true,
            usePlural: false,

            // Transformações customizadas para datas - formato correto
            customTransformInput: ({data, fieldAttributes}) => {
                if (fieldAttributes?.type === "date" && data instanceof Date) {
                    return data.toISOString();
                }
                return data;
            },

            customTransformOutput: ({data, fieldAttributes}) => {
                if (fieldAttributes?.type === "date" && typeof data === "string") {
                    return new Date(data);
                }
                return data;
            },

            // Para single-table design, podemos mapear as chaves
            ...(config.useSingleTable ? {
                mapKeysTransformInput: {
                    "id": "id",
                    "_type": "_type"
                },
                mapKeysTransformOutput: {
                    "id": "id",
                    "_type": "_type"
                }
            } : {})
        },

        // Implementação dos métodos do adapter - sem async wrapper
        adapter: (options) => {
            return {
                async create<T extends Record<string, any>>({model, data, select}: {
                    model: string;
                    data: T;
                    select?: string[]
                }) {
                    const tableName = getTableName(model);
                    const keys = createKeys(model, data.id);

                    const item = {
                        ...data,
                        ...keys,
                        ...(config.useSingleTable && {_type: model}),
                        createdAt: data.createdAt || new Date().toISOString(),
                        updatedAt: data.updatedAt || new Date().toISOString()
                    };

                    await docClient.send(new PutCommand({
                        TableName: tableName,
                        Item: item
                    }));

                    return item as T;
                },

                async update<T>({model, where, update}: { model: string; where: any; update: T }) {
                    const tableName = getTableName(model);

                    // Primeiro, encontrar o item
                    const existing = await this.findOne({model, where});
                    if (!existing) {
                        return null;
                    }

                    // Construir UpdateExpression
                    const updateExpressions: string[] = [];
                    const expressionValues: Record<string, any> = {};
                    const expressionNames: Record<string, string> = {};

                    Object.entries(update).forEach(([key, value], index) => {
                        const placeholder = `:val${index}`;
                        const namePlaceholder = `#${key}`;

                        updateExpressions.push(`${namePlaceholder} = ${placeholder}`);
                        expressionValues[placeholder] = value;
                        expressionNames[namePlaceholder] = key;
                    });

                    // Adicionar updatedAt
                    updateExpressions.push("#updatedAt = :updatedAt");
                    expressionValues[":updatedAt"] = new Date().toISOString();
                    expressionNames["#updatedAt"] = "updatedAt";

                    const keys = createKeys(model, existing.id);

                    const response = await docClient.send(new UpdateCommand({
                        TableName: tableName,
                        Key: keys,
                        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
                        ExpressionAttributeValues: expressionValues,
                        ExpressionAttributeNames: expressionNames,
                        ReturnValues: "ALL_NEW"
                    }));

                    return response.Attributes as T;
                },

                async updateMany({model, where, update}) {
                    // DynamoDB não tem update em batch nativo
                    const items = await this.findMany({model, where});

                    await Promise.all(
                        items.map(item =>
                            this.update({
                                model,
                                where: [{field: "id", value: item.id, operator: "eq", connector: "AND"}],
                                update
                            })
                        )
                    );

                    return items.length;
                },

                async delete({model, where}) {
                    const existing = await this.findOne({model, where});
                    if (!existing) return;

                    const tableName = getTableName(model);
                    const keys = createKeys(model, existing.id);

                    await docClient.send(new DeleteCommand({
                        TableName: tableName,
                        Key: keys
                    }));
                },

                async deleteMany({model, where}) {
                    const items = await this.findMany({model, where});

                    if (items.length === 0) return;

                    const tableName = getTableName(model);

                    // Usar BatchWrite para deletar múltiplos itens
                    const chunks = [];
                    for (let i = 0; i < items.length; i += 25) {
                        chunks.push(items.slice(i, i + 25));
                    }

                    for (const chunk of chunks) {
                        const deleteRequests = chunk.map(item => ({
                            DeleteRequest: {
                                Key: createKeys(model, item.id)
                            }
                        }));

                        await docClient.send(new BatchWriteCommand({
                            RequestItems: {
                                [tableName]: deleteRequests
                            }
                        }));
                    }

                    return items.length;
                },

                async findOne<T>({model, where, select}: { model: string; where: any; select?: string[] }) {
                    const tableName = getTableName(model);

                    // Converter CleanedWhere[] para objeto where
                    const whereObj: Record<string, any> = {};
                    if (where && Array.isArray(where)) {
                        where.forEach(w => {
                            if (w.operator === "eq") {
                                whereObj[w.field] = w.value;
                            } else {
                                whereObj[w.field] = {[w.operator]: w.value};
                            }
                        });
                    }

                    // Se temos um ID direto, usar GetItem
                    if (whereObj.id && Object.keys(whereObj).length === 1) {
                        const keys = createKeys(model, whereObj.id);

                        const response = await docClient.send(new GetCommand({
                            TableName: tableName,
                            Key: keys
                        }));

                        return (response.Item || null) as T | null;
                    }

                    // Caso contrário, fazer scan com filtro
                    if (Object.keys(whereObj).length === 0) {
                        return null;
                    }

                    const {FilterExpression, ExpressionAttributeValues, ExpressionAttributeNames} =
                        buildFilterExpression(whereObj);

                    const response = await docClient.send(new ScanCommand({
                        TableName: tableName,
                        FilterExpression,
                        ExpressionAttributeValues,
                        ExpressionAttributeNames,
                        Limit: 1
                    }));

                    return (response.Items?.[0] || null) as T | null;
                },

                async findMany<T>({model, where, limit, sortBy, offset}: {
                    model: string;
                    where?: any;
                    limit?: number;
                    sortBy?: any;
                    offset?: number
                }) {
                    const tableName = getTableName(model);

                    const params: any = {
                        TableName: tableName
                    };

                    // Converter CleanedWhere[] para objeto where
                    const whereObj: Record<string, any> = {};
                    if (where && Array.isArray(where)) {
                        where.forEach(w => {
                            if (w.operator === "eq") {
                                whereObj[w.field] = w.value;
                            } else {
                                whereObj[w.field] = {[w.operator]: w.value};
                            }
                        });
                    }

                    if (Object.keys(whereObj).length > 0) {
                        const {FilterExpression, ExpressionAttributeValues, ExpressionAttributeNames} =
                            buildFilterExpression(whereObj);

                        params.FilterExpression = FilterExpression;
                        params.ExpressionAttributeValues = ExpressionAttributeValues;
                        params.ExpressionAttributeNames = ExpressionAttributeNames;
                    }

                    if (limit) {
                        params.Limit = limit + (offset || 0);
                    }

                    const response = await docClient.send(new ScanCommand(params));

                    let items = response.Items || [];

                    // Aplicar sorting manualmente (DynamoDB não suporta sort em Scan)
                    if (sortBy) {
                        const {field, direction} = sortBy;
                        items.sort((a: any, b: any) => {
                            if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
                            if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
                            return 0;
                        });
                    }

                    // Aplicar offset
                    if (offset) {
                        items = items.slice(offset);
                    }

                    // Aplicar limit
                    if (limit) {
                        items = items.slice(0, limit);
                    }

                    return items as T[];
                },

                async count({model, where}) {
                    const items = await this.findMany({model, where});
                    return items.length;
                },

                createSchema: async ({ file, tables }) => {
                    // Gerar template CloudFormation para DynamoDB
                    const template: {
                        AWSTemplateFormatVersion: string;
                        Resources: Record<string, any>;
                    } = {
                        AWSTemplateFormatVersion: "2010-09-09",
                        Resources: {}
                    };

                    if (config.useSingleTable) {
                        // Single table design
                        template.Resources["BetterAuthTable"] = {
                            Type: "AWS::DynamoDB::Table",
                            Properties: {
                                TableName: config.tableName || "better-auth",
                                BillingMode: "PAY_PER_REQUEST",
                                AttributeDefinitions: [
                                    {AttributeName: "PK", AttributeType: "S"},
                                    {AttributeName: "SK", AttributeType: "S"},
                                    {AttributeName: "GSI1PK", AttributeType: "S"},
                                    {AttributeName: "GSI1SK", AttributeType: "S"}
                                ],
                                KeySchema: [
                                    {AttributeName: "PK", KeyType: "HASH"},
                                    {AttributeName: "SK", KeyType: "RANGE"}
                                ],
                                GlobalSecondaryIndexes: [
                                    {
                                        IndexName: "GSI1",
                                        KeySchema: [
                                            {AttributeName: "GSI1PK", KeyType: "HASH"},
                                            {AttributeName: "GSI1SK", KeyType: "RANGE"}
                                        ],
                                        Projection: {ProjectionType: "ALL"}
                                    }
                                ]
                            }
                        };
                    } else {
                        // Multi-table design
                        Object.entries(tables).forEach(([key, table]) => {
                            const tableName = getTableName(table.modelName);
                            template.Resources[`${key}Table`] = {
                                Type: "AWS::DynamoDB::Table",
                                Properties: {
                                    TableName: tableName,
                                    BillingMode: "PAY_PER_REQUEST",
                                    AttributeDefinitions: [
                                        {AttributeName: "id", AttributeType: "S"}
                                    ],
                                    KeySchema: [
                                        {AttributeName: "id", KeyType: "HASH"}
                                    ]
                                }
                            };
                        });
                    }

                    const schemaCode = JSON.stringify(template, null, 2);

                    return {
                        code: schemaCode,
                        path: file || "dynamodb-cloudformation.json",
                        overwrite: true
                    };
                }
            };
        }
    });
};
