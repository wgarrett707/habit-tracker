// @ts-nocheck
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Database setup
const dbPromise = open({
  filename: 'habits.db',
  driver: sqlite3.Database
});

// Initialize database
async function initDb() {
  const db = await dbPromise;
  
  // Create habits table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#0066cc'
    )
  `);

  // Add color column if it doesn't exist
  try {
    await db.get('SELECT color FROM habits LIMIT 1');
  } catch (e) {
    await db.exec('ALTER TABLE habits ADD COLUMN color TEXT DEFAULT "#0066cc"');
  }

  // Create habit_logs table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits(id),
      UNIQUE(habit_id, date)
    )
  `);
}

// API Endpoints

// Get all habits
app.get('/habits', async (req, res) => {
  const db = await dbPromise;
  const habits = await db.all('SELECT * FROM habits');
  res.json(habits);
});

// Add a new habit
app.post('/habits', async (req, res) => {
  const { name, color } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const db = await dbPromise;
  const result = await db.run('INSERT INTO habits (name, color) VALUES (?, ?)', [name, color || '#0066cc']);
  res.json({ id: result.lastID, name, color: color || '#0066cc' });
});

// Get a single habit
app.get('/habits/:id', async (req, res) => {
  const { id } = req.params;
  const db = await dbPromise;
  const habit = await db.get('SELECT * FROM habits WHERE id = ?', [id]);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  res.json(habit);
});

// Get habit logs for a specific habit
app.get('/habits/:id/logs', async (req, res) => {
  const { id } = req.params;
  const db = await dbPromise;
  const logs = await db.all('SELECT date FROM habit_logs WHERE habit_id = ?', [id]);
  // Ensure dates are returned in YYYY-MM-DD format
  res.json(logs.map(log => log.date));
});

// Toggle a habit log (add or remove)
app.post('/habits/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  const db = await dbPromise;
  
  // Check if log exists
  const existingLog = await db.get(
    'SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?',
    [id, date]
  );

  if (existingLog) {
    // Remove log
    await db.run(
      'DELETE FROM habit_logs WHERE habit_id = ? AND date = ?',
      [id, date]
    );
    res.json({ action: 'removed' });
  } else {
    // Add log
    await db.run(
      'INSERT INTO habit_logs (habit_id, date) VALUES (?, ?)',
      [id, date]
    );
    res.json({ action: 'added' });
  }
});

// Remove a habit log (explicit delete)
app.delete('/habits/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  const db = await dbPromise;
  await db.run(
    'DELETE FROM habit_logs WHERE habit_id = ? AND date = ?',
    [id, date]
  );
  res.json({ action: 'removed' });
});

// Delete a habit and its associated logs
app.delete('/habits/:id', async (req, res) => {
  const { id } = req.params;
  const db = await dbPromise;

  try {
    // First check if the habit exists
    const habit = await db.get('SELECT id FROM habits WHERE id = ?', [id]);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Delete associated logs first (due to foreign key constraint)
    await db.run('DELETE FROM habit_logs WHERE habit_id = ?', [id]);
    
    // Then delete the habit
    await db.run('DELETE FROM habits WHERE id = ?', [id]);
    
    res.json({ action: 'deleted' });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Update habit color
app.patch('/habits/:id/color', async (req, res) => {
  const { id } = req.params;
  const { color } = req.body;
  
  if (!color) {
    return res.status(400).json({ error: 'Color is required' });
  }

  const db = await dbPromise;
  await db.run('UPDATE habits SET color = ? WHERE id = ?', [color, id]);
  res.json({ id, color });
});

// Start server
initDb().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}); 