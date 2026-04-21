import { Request, Response, NextFunction } from 'express';
import { evaluateTransaction } from '../../services/transaction.service';
import { TransactionInputDTO } from '../../schemas/transaction.schema';

export async function evaluate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as TransactionInputDTO;
    const result = await evaluateTransaction(input);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof Error && err.message.includes('already been evaluated')) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
}
