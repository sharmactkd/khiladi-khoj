import { env } from "../config/env.js";

export function errorMiddleware(error, request, response, _next) {
  const statusCode =
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode <= 599
      ? error.statusCode
      : 500;

  request.log?.error(
    {
      error,
      method: request.method,
      path: request.originalUrl,
      statusCode,
    },
    "Request failed",
  );

  response.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && env.IS_PRODUCTION
        ? "Internal server error"
        : error.message,
  });
}
