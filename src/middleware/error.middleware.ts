import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = error.name === 'ValidationError' ? 400 : 500;
  const message = error.message || 'Something went wrong';

  logger.error(
    `[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`
  );

  res.status(status).json({
    error: {
      message,
      status,
    },
  });
};

export default errorMiddleware;
