import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    logger.info('HTTP request', {
      method:     req.method,
      path:       req.path,
      status:     res.statusCode,
      duration_ms: Date.now() - start,
    });
  });

  next();
}
