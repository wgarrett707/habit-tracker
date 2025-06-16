import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

export function setupHabitRoutes(app: Router) {
  // Get all habits for a user
  app.get('/api/habits', authenticateToken, async (req: any, res) => {
    try {
      const result = await query('SELECT * FROM habits WHERE user_id = $1', [req.user.id]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching habits:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get a single habit
  app.get('/api/habits/:id', authenticateToken, async (req: any, res) => {
    try {
      const result = await query(
        'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Habit not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching habit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create a new habit
  app.post('/api/habits', authenticateToken, async (req: any, res) => {
    const { name, description, frequency } = req.body;

    try {
      const result = await query(
        'INSERT INTO habits (user_id, name, description, frequency) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.user.id, name, description, frequency]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating habit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update a habit
  app.patch('/api/habits/:id', authenticateToken, async (req: any, res) => {
    const { name, description, frequency } = req.body;

    try {
      const result = await query(
        'UPDATE habits SET name = $1, description = $2, frequency = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
        [name, description, frequency, req.params.id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Habit not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating habit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete a habit
  app.delete('/api/habits/:id', authenticateToken, async (req: any, res) => {
    try {
      await query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting habit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Toggle habit completion
  app.post('/api/habits/:id/complete', authenticateToken, async (req: any, res) => {
    const { date } = req.body;

    try {
      const existingCompletion = await query(
        'SELECT * FROM completions WHERE habit_id = $1 AND date = $2',
        [req.params.id, date]
      );

      if (existingCompletion.rows.length > 0) {
        await query('DELETE FROM completions WHERE id = $1', [existingCompletion.rows[0].id]);
        res.json({ completed: false });
      } else {
        await query('INSERT INTO completions (habit_id, date) VALUES ($1, $2)', [req.params.id, date]);
        res.json({ completed: true });
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get habit completions
  app.get('/api/habits/:id/completions', authenticateToken, async (req: any, res) => {
    try {
      const result = await query(
        'SELECT date FROM completions WHERE habit_id = $1',
        [req.params.id]
      );
      res.json(result.rows.map(c => c.date));
    } catch (error) {
      console.error('Error fetching completions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
} 