// An error that carries an HTTP status code and a message that is safe to
// show to the user. Anything that is not an AppError becomes a generic 500.
export class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = options.details;
  }
}

export const notFound = (what = 'Resource') => new AppError(404, `${what} not found.`);
