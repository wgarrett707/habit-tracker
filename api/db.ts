import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        frequency TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS completions (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id),
        date TEXT NOT NULL
      );
    `);

    // Create test user if none exists
    const testUser = await client.query('SELECT * FROM users WHERE username = $1', ['test']);
    if (testUser.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      await client.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['test', hashedPassword]);
    }

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
} 