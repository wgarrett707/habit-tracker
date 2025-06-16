import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function setupAuthRoutes(app: Router) {
  // Login
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      const result = await query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ token, username: user.username });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Register
  app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    try {
      const existingUser = await query('SELECT * FROM users WHERE username = $1', [username]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
        [username, hashedPassword]
      );
      
      const token = jwt.sign({ id: result.rows[0].id, username }, JWT_SECRET);
      res.status(201).json({ token, username });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
} 