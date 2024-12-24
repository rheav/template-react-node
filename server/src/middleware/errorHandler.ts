import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface CustomError {
  type?: string;
  errors?: any[];
  status?: number;
  message?: string;
}

export const errorHandler = (
  err: CustomError | Error | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Error Handler]:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }

  const customError = err as CustomError;
  if (customError.type === 'validation') {
    return res.status(400).json({
      error: 'Validation Error',
      details: customError.errors
    });
  }

  // Default error response
  res.status(customError.status || 500).json({
    error: customError.message || 'Internal Server Error'
  });
};
