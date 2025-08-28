// src/lib/db.ts
import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';

let pool: mysql.Pool | null = null;

// Lazy-initialize connection pool
function getPool(): mysql.Pool {
  if (!pool) {
    const user = env.DB_USER;
    const password = env.DB_PASSWORD;
    const host = env.DB_HOST ?? 'localhost';
    const database = env.DB_NAME;

    if (!user || !password || !database) {
      throw new Error('Database credentials not set in environment');
    }

    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

/**
 * Execute a query on the database.
 * @param sql SQL string with ? placeholders
 * @param params Optional parameters for prepared statement
 * @returns Result rows
 */
export async function query<T extends MySQLResult<any> = MySQLResult<any>>(sql: string, params?: any[]): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute<any>(sql, params);
  return rows;
}

export type MySQLInsertResult = {
  insertId: number;
  affectedRows: number;
};
export type MySQLSelectResult<T = any> = T[];
export type MySQLUpdateResult = {
  affectedRows: number;
  changedRows: number;
};
export type MySQLDeleteResult = {
  affectedRows: number;
};
export type MySQLResult<T = any> = MySQLSelectResult<T> | MySQLInsertResult | MySQLUpdateResult | MySQLDeleteResult;

export type MySQLSchedulesRecord = {
  id: number;
  run_at: number;
  cron: string;
  command: string;
  author: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};
export type MySQLPlaySessionsRecord = {
  id: number;
  username: string;
  start_time: number;
  end_time: number | null;
  active: boolean;
};

export default {
  query
}