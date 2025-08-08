import { betterAuth } from 'better-auth';
import { dynamoDBAdapter } from './dynamoDBAdapter';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:8000',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ['http://localhost:5173'],
  database: dynamoDBAdapter({
    region: 'us-east-1',
    useSingleTable: true,
    tableName: 'better-auth',
  }),
  emailAndPassword: {
    enabled: true,
  },
});
