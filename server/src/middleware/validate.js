import { z } from 'zod';
import { AppError } from '../lib/AppError.js';

// Validates req.body (or another request part) with a Zod schema and replaces
// it with the parsed, typed value.
export const validate =
  (schema, part = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) {
      const first = result.error.issues[0];
      const field = first?.path?.join('.');
      throw new AppError(400, field ? `${field}: ${first.message}` : first?.message ?? 'Invalid request.', {
        details: z.flattenError(result.error).fieldErrors,
      });
    }
    if (part === 'body') req.body = result.data;
    else req.validated = { ...req.validated, [part]: result.data };
    next();
  };
