/**
 * Application level error. Anything thrown as an ApiError reaches the client
 * with its status code and message intact; everything else is treated as an
 * internal failure and sanitised by the error middleware.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly isOperational = true;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message);
  }

  static forbidden(message = "You do not have access to this resource") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Resource already exists") {
    return new ApiError(409, message);
  }

  static tooMany(message = "Too many requests, please slow down") {
    return new ApiError(429, message);
  }

  static badGateway(message = "Upstream service returned an invalid response") {
    return new ApiError(502, message);
  }

  static serviceUnavailable(message = "Service temporarily unavailable") {
    return new ApiError(503, message);
  }
}
