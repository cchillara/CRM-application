
import { ApiError } from "../utils/apiError.js";

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = "Internal Server Error";
  let errors = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err?.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON request body";
  } else if (err?.code === "P2002") {
    statusCode = 409;
    message = "A record with this value already exists";
  } else if (err?.code === "P2025") {
    statusCode = 404;
    message = "Requested record was not found";
  } else if (err?.code === "P2003") {
    statusCode = 400;
    message = "The request references a record that does not exist";
  } else if (err?.code === "P2023") {
    statusCode = 400;
    message = "Invalid record identifier or data format";
  } else if (err?.code === "P1001" || err?.code === "P1002") {
    statusCode = 503;
    message = "Database service is temporarily unavailable";
  } else if (
    Number.isInteger(err?.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
  ) {
    statusCode = err.statusCode;
    message = statusCode >= 500
      ? "Internal Server Error"
      : err.message;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(`[${req.id ?? "-"}] API error:`, err);
  }

  return res.status(statusCode).json({
    statusCode,
    data: null,
    message,
    success: false,
    errors,
    requestId: req.id ?? null,
  });
};
