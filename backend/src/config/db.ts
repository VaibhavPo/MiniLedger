import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'miniledger',
});

// Simple wrapper function to execute queries
export async function query(sql: string, params: any[] = []): Promise<QueryResult> {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

// Automatically create tables if they do not exist
export async function initDatabase(): Promise<void> {
  console.log('[Database] Checking and initializing database tables...');

  // 1. Users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      identifier VARCHAR(150) UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 2. OTPs table (for mocked login & registration verification)
  const createOtpsTable = `
    CREATE TABLE IF NOT EXISTS otps (
      id SERIAL PRIMARY KEY,
      identifier VARCHAR(150) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 3. Loans table
  const createLoansTable = `
    CREATE TABLE IF NOT EXISTS loans (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_name VARCHAR(120) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      repaid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      due_date DATE NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await query(createUsersTable);
    await query(createOtpsTable);
    await query(createLoansTable);
    console.log('[Database] Tables initialized successfully: users, otps, loans');
  } catch (error) {
    console.error('[Database] Error initializing tables:', error);
    throw error;
  }
}
