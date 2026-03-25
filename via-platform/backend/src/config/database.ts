import { Pool } from 'pg';
import { env } from './env';

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  min: env.DATABASE_POOL_MIN,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

db.on('error', (err) => console.error('PostgreSQL pool error', err));

export async function checkDbConnection(): Promise<void> {
  const client = await db.connect();
  await client.query('SELECT 1');
  client.release();
}
