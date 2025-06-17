// @ts-nocheck
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { Pool } from 'pg';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Database setup
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    sslmode: 'require'
  } : false
});

// Initialize database
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Attempting to connect to database...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      )
    `);
    console.log('Users table created/verified');

    // Create habits table
    await client.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        color TEXT DEFAULT '#0066cc'
      )
    `);
    console.log('Habits table created/verified');

    // Create habit_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        date TEXT NOT NULL
      )
    `);
    console.log('Habit logs table created/verified');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const client = await pool.connect();

    try {
      // Check if username exists
      const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [username]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await client.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
        [username, passwordHash]
      );

      // Generate token
      const token = jwt.sign({ id: result.rows[0].id, username }, JWT_SECRET);
      res.json({ token });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const client = await pool.connect();

    try {
      // Find user
      const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ token });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Protected routes
app.get('/api/habits', authenticateToken, async (req: any, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM habits WHERE user_id = $1', [req.user.id]);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Error fetching habits' });
  }
});

app.get('/api/habits/:id', authenticateToken, async (req: any, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Habit not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching habit:', error);
    res.status(500).json({ error: 'Error fetching habit' });
  }
});

app.post('/api/habits', authenticateToken, async (req: any, res) => {
  try {
    const { name } = req.body;
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO habits (user_id, name) VALUES ($1, $2) RETURNING *',
        [req.user.id, name]
      );
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Error creating habit' });
  }
});

app.delete('/api/habits/:id', authenticateToken, async (req: any, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
      res.json({ message: 'Habit deleted' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Error deleting habit' });
  }
});

app.patch('/api/habits/:id/color', authenticateToken, async (req: any, res) => {
  try {
    const { color } = req.body;
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE habits SET color = $1 WHERE id = $2 AND user_id = $3',
        [color, req.params.id, req.user.id]
      );
      res.json({ message: 'Color updated' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating color:', error);
    res.status(500).json({ error: 'Error updating color' });
  }
});

app.get('/api/habits/:id/logs', authenticateToken, async (req: any, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT date FROM habit_logs WHERE habit_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      res.json(result.rows.map(log => log.date));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Error fetching logs' });
  }
});

app.post('/api/habits/:id/logs', authenticateToken, async (req: any, res) => {
  try {
    const { date } = req.body;
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO habit_logs (habit_id, user_id, date) VALUES ($1, $2, $3)',
        [req.params.id, req.user.id, date]
      );
      res.json({ message: 'Log added' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding log:', error);
    res.status(500).json({ error: 'Error adding log' });
  }
});

app.delete('/api/habits/:id/logs', authenticateToken, async (req: any, res) => {
  try {
    const { date } = req.body;
    const client = await pool.connect();
    try {
      await client.query(
        'DELETE FROM habit_logs WHERE habit_id = $1 AND user_id = $2 AND date = $3',
        [req.params.id, req.user.id, date]
      );
      res.json({ message: 'Log deleted' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Error deleting log' });
  }
});

// Serve static files from dist
app.use(express.static(path.join(process.cwd(), 'dist')));

// Fallback to index.html for SPA routes (non-API)
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 