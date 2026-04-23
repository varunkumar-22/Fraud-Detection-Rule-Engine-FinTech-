import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { createRuleSchema, updateRuleSchema, toggleRuleSchema } from '../../schemas/rule.schema';
import { getAll, getOne, create, update, toggle, remove } from '../controllers/rules.controller';

const router = Router();

router.get('/',         getAll);
router.get('/:id',      getOne);
router.post('/',        validate(createRuleSchema), create);
router.put('/:id',      validate(updateRuleSchema), update);
router.patch('/:id',    validate(toggleRuleSchema), toggle);
router.delete('/:id',   remove);

export default router;
