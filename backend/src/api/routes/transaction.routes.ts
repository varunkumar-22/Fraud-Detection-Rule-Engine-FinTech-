import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { transactionInputSchema } from '../../schemas/transaction.schema';
import { evaluate } from '../controllers/transaction.controller';

const router = Router();

// POST /api/transactions/evaluate
router.post('/evaluate', validate(transactionInputSchema), evaluate);

export default router;
