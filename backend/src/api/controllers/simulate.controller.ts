import { Request, Response, NextFunction } from 'express';
import { simulateTransaction } from '../../services/simulate.service';
import { SimulateInputDTO } from '../../schemas/simulate.schema';

export async function simulate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input  = req.body as SimulateInputDTO;
    const result = await simulateTransaction(input);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
