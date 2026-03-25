import { db } from '../config/database';
import type { User } from '../types';

function rowToUser(row: Record<string, unknown>): User {
  return {
    id:        row.id as string,
    email:     row.email as string,
    fullName:  row.full_name as string | null,
    plan:      row.plan as string,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export const userRepository = {
  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const { rows } = await db.query(
      `SELECT id, email, password_hash, full_name, plan, created_at FROM users WHERE email = $1`,
      [email]
    );
    if (!rows.length) return null;
    return { ...rowToUser(rows[0]), passwordHash: rows[0].password_hash as string };
  },

  async findById(id: string): Promise<User | null> {
    const { rows } = await db.query(
      `SELECT id, email, full_name, plan, created_at FROM users WHERE id = $1`, [id]
    );
    return rows.length ? rowToUser(rows[0]) : null;
  },

  async create(email: string, passwordHash: string, fullName?: string): Promise<User> {
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, plan, created_at`,
      [email, passwordHash, fullName ?? null]
    );
    return rowToUser(rows[0]);
  },

  async emailExists(email: string): Promise<boolean> {
    const { rows } = await db.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
    return rows.length > 0;
  },
};
