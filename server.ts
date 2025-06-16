// @ts-nocheck
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use a proper secret

// Database setup
let dbPromise: Promise<any>;

// Initialize database
async function initDb() {
  const db = await open({
    filename: 'habits.db',
    driver: sqlite3.Database
  });
  
  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);

  // Update habits table to include user_id
  await db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#0066cc',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Update habit_logs table to include user_id
  await db.exec(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  return db;
}

// Initialize database and start server
async function startServer() {
  try {
    dbPromise = initDb();
    const db = await dbPromise;
    console.log('Database initialized successfully');

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
    app.post('/auth/signup', async (req, res) => {
      try {
        const { username, password } = req.body;
        const db = await dbPromise;

        // Check if username exists
        const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser) {
          return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await db.run(
          'INSERT INTO users (username, password_hash) VALUES (?, ?)',
          [username, passwordHash]
        );

        // Generate token
        const token = jwt.sign({ id: result.lastID, username }, JWT_SECRET);
        res.json({ token });
      } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({ error: 'Error creating user' });
      }
    });

    app.post('/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const db = await dbPromise;

        // Find user
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
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
      } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Error logging in' });
      }
    });

    // Protected routes
    app.get('/habits', authenticateToken, async (req: any, res) => {
      try {
        const db = await dbPromise;
        const habits = await db.all('SELECT * FROM habits WHERE user_id = ?', [req.user.id]);
        res.json(habits);
      } catch (error) {
        console.error('Error fetching habits:', error);
        res.status(500).json({ error: 'Error fetching habits' });
      }
    });

    app.get('/habits/:id', authenticateToken, async (req: any, res) => {
      try {
        const db = await dbPromise;
        const habit = await db.get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (!habit) {
          return res.status(404).json({ error: 'Habit not found' });
        }
        res.json(habit);
      } catch (error) {
        console.error('Error fetching habit:', error);
        res.status(500).json({ error: 'Error fetching habit' });
      }
    });

    app.post('/habits', authenticateToken, async (req: any, res) => {
      try {
        const { name } = req.body;
        const db = await dbPromise;
        const result = await db.run(
          'INSERT INTO habits (user_id, name) VALUES (?, ?)',
          [req.user.id, name]
        );
        res.json({ id: result.lastID, name, user_id: req.user.id });
      } catch (error) {
        console.error('Error creating habit:', error);
        res.status(500).json({ error: 'Error creating habit' });
      }
    });

    app.delete('/habits/:id', authenticateToken, async (req: any, res) => {
      try {
        const db = await dbPromise;
        await db.run('DELETE FROM habits WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Habit deleted' });
      } catch (error) {
        console.error('Error deleting habit:', error);
        res.status(500).json({ error: 'Error deleting habit' });
      }
    });

    app.patch('/habits/:id/color', authenticateToken, async (req: any, res) => {
      try {
        const { color } = req.body;
        const db = await dbPromise;
        await db.run(
          'UPDATE habits SET color = ? WHERE id = ? AND user_id = ?',
          [color, req.params.id, req.user.id]
        );
        res.json({ message: 'Color updated' });
      } catch (error) {
        console.error('Error updating color:', error);
        res.status(500).json({ error: 'Error updating color' });
      }
    });

    app.get('/habits/:id/logs', authenticateToken, async (req: any, res) => {
      try {
        const db = await dbPromise;
        const logs = await db.all(
          'SELECT date FROM habit_logs WHERE habit_id = ? AND user_id = ?',
          [req.params.id, req.user.id]
        );
        res.json(logs.map(log => log.date));
      } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Error fetching logs' });
      }
    });

    app.post('/habits/:id/logs', authenticateToken, async (req: any, res) => {
      try {
        const { date } = req.body;
        const db = await dbPromise;
        await db.run(
          'INSERT INTO habit_logs (habit_id, user_id, date) VALUES (?, ?, ?)',
          [req.params.id, req.user.id, date]
        );
        res.json({ message: 'Log added' });
      } catch (error) {
        console.error('Error adding log:', error);
        res.status(500).json({ error: 'Error adding log' });
      }
    });

    app.delete('/habits/:id/logs', authenticateToken, async (req: any, res) => {
      try {
        const { date } = req.body;
        const db = await dbPromise;
        await db.run(
          'DELETE FROM habit_logs WHERE habit_id = ? AND user_id = ? AND date = ?',
          [req.params.id, req.user.id, date]
        );
        res.json({ message: 'Log deleted' });
      } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ error: 'Error deleting log' });
      }
    });

    // Start server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 