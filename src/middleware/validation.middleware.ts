import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../utils/logger';

const identifyRequestSchema = Joi.object({
  email: Joi.string().email().optional().allow(null, ''),
  phoneNumber: Joi.string().optional().allow(null, ''),
}).or('email', 'phoneNumber');

export const validateIdentifyRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = identifyRequestSchema.validate(req.body, {
    abortEarly: false, // Collect all errors instead of stopping at first
    stripUnknown: true, // Remove unknown fields
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    logger.error(`Validation error: ${errorMessage}`);
    return res.status(400).json({ error: errorMessage });
  }

  // Replace body with validated and sanitized data
  req.body = value;
  next();
};
