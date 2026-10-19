
import { ApiError } from "../utils/apiError.js";

export const validateBody = ({
    required = [],
    requiredAnyOf = [],
    allowedFields = [],
} = {}) => {
    return (req, res, next) => {
        const body = req.body;

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body)
        ) {
            return next(
                new ApiError(400, "Request body must be a JSON object")
            );
        }

        const missingFields = required.filter((field) => {
            const value = body[field];

            return (
                value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === "")
            );
        });

        if (missingFields.length > 0) {
            return next(
                new ApiError(
                    400,
                    `Missing required fields: ${missingFields.join(", ")}`,
                    missingFields.map((field) => ({
                        field,
                        message: `${field} is required`,
                    }))
                )
            );
        }

        if (requiredAnyOf.length > 0) {
            const hasRequiredField = requiredAnyOf.some((field) => {
                const value = body[field];

                return (
                    value !== undefined &&
                    value !== null &&
                    !(typeof value === "string" && value.trim() === "")
                );
            });

            if (!hasRequiredField) {
                return next(
                    new ApiError(
                        400,
                        `At least one of these fields is required: ${requiredAnyOf.join(", ")}`,
                        requiredAnyOf.map((field) => ({
                            field,
                            message: `${field} is an accepted alternative`,
                        }))
                    )
                );
            }
        }

        if (allowedFields.length > 0) {
            const unknownFields = Object.keys(body).filter(
                (field) => !allowedFields.includes(field)
            );

            if (unknownFields.length > 0) {
                return next(
                    new ApiError(
                        400,
                        "Request contains unsupported fields",
                        unknownFields.map((field) => ({
                            field,
                            message: "Unsupported field",
                        }))
                    )
                );
            }
        }

        return next();
    };
};
