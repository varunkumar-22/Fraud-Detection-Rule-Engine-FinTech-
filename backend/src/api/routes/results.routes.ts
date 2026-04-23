import { Router } from 'express';
import { list, getOne } from '../controllers/results.controller';

const router = Router();

// GET /api/results?limit=20&offset=0&decision=BLOCK
router.get('/', list);

// GET /api/results/:txId
router.get('/:txId', getOne);

export default router;
