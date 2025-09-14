import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

const app = new Elysia()
  .use(cors())
  .get('/', () => 'Hello from Hotel Backend!')
  .get('/test', () => ({ status: 'Server is running!' }))
  .listen(3001);

console.log('🦊 Elysia is running at http://localhost:3001');
