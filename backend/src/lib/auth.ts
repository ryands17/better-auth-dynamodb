import { betterAuth } from 'better-auth';
import { z } from 'zod';
import { dynamoDBAdapter } from './dynamoDBAdapter';

const env = z
  .object({
    BETTER_AUTH_URL: z.string().default('http://localhost:3000'),
    BETTER_AUTH_SECRET: z.string(),
  })
  .transform((val) => ({
    betterAuthUrl: val.BETTER_AUTH_URL,
    betterAuthSecret: val.BETTER_AUTH_SECRET,
  }))
  .parse(process.env);

export const auth = betterAuth({
  baseURL: env.betterAuthUrl,
  secret: env.betterAuthSecret,
  trustedOrigins: ['http://localhost:5173'],
  database: dynamoDBAdapter({
    region: 'us-east-1',
    useSingleTable: true,
    tableName: 'better-auth',
  }),
  emailAndPassword: { enabled: true },
});
