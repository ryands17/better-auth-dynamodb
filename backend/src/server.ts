import { serve } from '@hono/node-server';
import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './lib/auth';

const app = new Hono();

app.use(
  '*', // or replace with "*" to enable cors for all routes
  cors({
    origin: 'http://localhost:3001', // replace with your origin
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
);

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

serve(app, (info) =>
  console.info(`App running on http://localhost:${info.port}`),
);
