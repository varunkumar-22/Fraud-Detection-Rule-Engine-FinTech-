import { Request, Response, NextFunction } from 'express';
import { getResults, getResultByTxId } from '../../services/results.service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit    = Math.min(parseInt(req.query.limit  as string) || 20, 100);
    const offset   = parseInt(req.query.offset as string) || 0;
    const decision = req.query.decision as string | undefined;

    const { results, total } = await getResults(limit, offset, decision);

    res.status(200).json({
      success: true,
      data:    results,
      meta:    { total, limit, offset },
    });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getResultByTxId(req.params.txId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Evaluation result not found' });
      return;
    }
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
