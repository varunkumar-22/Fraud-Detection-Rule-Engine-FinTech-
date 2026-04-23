import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { simulateInputSchema } from '../../schemas/simulate.schema';
import { simulate } from '../controllers/simulate.controller';

const router = Router();

// POST /api/simulate
router.post('/', validate(simulateInputSchema), simulate);

export default router;
