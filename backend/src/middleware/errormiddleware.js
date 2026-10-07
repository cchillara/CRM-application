import { ApiError } from "../utils/apiError.js";

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      data: err.data,
      message: err.message,
      success: err.success,
      errors: err.errors,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    statusCode,
    data: null,
    message,
    success: false,
    errors: [],
  });
};
