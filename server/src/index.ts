import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { twilioRouter } from './routes/twilio.js';
import { goalsRouter } from './routes/goals.js';
import { calendarRouter } from './routes/calendar.js';
import { statsRouter } from './routes/stats.js';
import { progressRouter } from './routes/progress.js';
import { billingRouter } from './routes/billing.js';
import { webhookRouter } from './routes/webhook.js';
import { shiftsRouter } from './routes/shifts.js';
import { startCronJobs } from './services/cron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook needs raw body - must come before json middleware
app.use('/api/webhook', webhookRouter);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/twilio', twilioRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/stats', statsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/billing', billingRouter);
app.use('/api/shifts', shiftsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DisciplineOS server running on port ${PORT}`);
  console.log(`📱 Twilio webhook: http://localhost:${PORT}/api/twilio/webhook`);
  
  // Start cron jobs
  startCronJobs();
});

export default app;

