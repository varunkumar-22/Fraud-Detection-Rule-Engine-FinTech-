import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { requestLogger } from './api/middlewares/logger.middleware';
import { errorHandler } from './api/middlewares/errorHandler.middleware';

import transactionRoutes from './api/routes/transaction.routes';
import rulesRoutes       from './api/routes/rules.routes';
import simulateRoutes    from './api/routes/simulate.routes';
import resultsRoutes     from './api/routes/results.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/transactions', transactionRoutes);
app.use('/api/rules',        rulesRoutes);
app.use('/api/simulate',     simulateRoutes);
app.use('/api/results',      resultsRoutes);

app.use(errorHandler);

export default app;
