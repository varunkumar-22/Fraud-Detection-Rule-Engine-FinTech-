import { Request, Response, NextFunction } from 'express';
import * as rulesService from '../../services/rules.service';
import { CreateRuleDTO, UpdateRuleDTO, ToggleRuleDTO } from '../../schemas/rule.schema';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rules = await rulesService.getAllRules();
    res.status(200).json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await rulesService.getRuleById(req.params.id);
    if (!rule) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }
    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await rulesService.createRule(req.body as CreateRuleDTO);
    res.status(201).json({ success: true, data: rule });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('unique')) {
      res.status(409).json({ success: false, error: 'A rule with that name already exists' });
      return;
    }
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await rulesService.updateRule(req.params.id, req.body as UpdateRuleDTO);
    if (!rule) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }
    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
}

export async function toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await rulesService.toggleRule(req.params.id, req.body as ToggleRuleDTO);
    if (!rule) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }
    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await rulesService.deleteRule(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    next(err);
  }
}
