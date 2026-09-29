import multer from 'multer';
import mongoose from 'mongoose';
import { AppError } from '../lib/AppError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  // A streamed response (e.g. audio) already started: let Express close the socket.
  if (res.headersSent) {
    console.error('[error] after headers sent:', req.method, req.originalUrl, error.message);
    return next(error);
  }

  let status = 500;
  let message = 'Something went wrong on our side. Please try again.';
  let details;

  if (error instanceof AppError) {
    status = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof multer.MulterError) {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'That file is too large.' : error.message;
  } else if (error instanceof mongoose.Error.CastError) {
    status = 404;
    message = 'Not found.';
  } else if (error?.type === 'entity.too.large') {
    status = 413;
    message = 'Request is too large.';
  } else if (error?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body.';
  }

  if (status >= 500) console.error('[error]', req.method, req.originalUrl, error.cause ?? error);

  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}
