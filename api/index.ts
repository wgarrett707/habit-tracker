import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db';
import { setupAuthRoutes } from './routes/auth';
import { setupHabitRoutes } from './routes/habits';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
setupAuthRoutes(app);
setupHabitRoutes(app);

// Export the Express API
export default app; 