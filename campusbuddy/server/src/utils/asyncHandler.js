/** Wraps an async route so rejected promises reach the Express error handler. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
