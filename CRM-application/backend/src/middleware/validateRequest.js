
import { ApiError } from "../utils/apiError.js";

/* ──────────────────────────────────────────────────────────────
 * validateBody
 *
 * Validates the JSON request body against a simple schema.
 * Options:
 *   required      – fields that MUST be present and non-empty.
 *   requiredAnyOf – at least one of these fields must be present.
 *   allowedFields – if provided, any other field is rejected.
 * ──────────────────────────────────────────────────────────────*/
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

/* ──────────────────────────────────────────────────────────────
 * validateParams
 *
 * Validates route parameters (req.params).
 * Options:
 *   required – param names that must be present and non-empty.
 *   uuid     – param names that must look like a UUID v4.
 * ──────────────────────────────────────────────────────────────*/
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validateParams = ({
    required = [],
    uuid = [],
} = {}) => {
    return (req, res, next) => {
        for (const param of required) {
            const value = req.params?.[param];
            if (!value || (typeof value === "string" && value.trim() === "")) {
                return next(
                    new ApiError(400, `Route parameter '${param}' is required`)
                );
            }
        }

        for (const param of uuid) {
            const value = req.params?.[param];
            if (value && !UUID_RE.test(value)) {
                return next(
                    new ApiError(
                        400,
                        `Route parameter '${param}' must be a valid UUID`
                    )
                );
            }
        }

        return next();
    };
};

/* ──────────────────────────────────────────────────────────────
 * validatePagination
 *
 * Parses and validates ?page and ?limit query parameters.
 * Attaches req.pagination = { page, limit, skip } for
 * controllers to use directly.
 *
 * Options:
 *   defaultLimit – items per page when not supplied (default 20).
 *   maxLimit     – upper cap on limit (default 100).
 * ──────────────────────────────────────────────────────────────*/
export const validatePagination = ({
    defaultLimit = 20,
    maxLimit = 100,
} = {}) => {
    return (req, res, next) => {
        const rawPage = req.query.page;
        const rawLimit = req.query.limit;

        let page = 1;
        let limit = defaultLimit;

        if (rawPage !== undefined) {
            page = parseInt(rawPage, 10);
            if (!Number.isInteger(page) || page < 1) {
                return next(
                    new ApiError(
                        400,
                        "Query parameter 'page' must be a positive integer"
                    )
                );
            }
        }

        if (rawLimit !== undefined) {
            limit = parseInt(rawLimit, 10);
            if (!Number.isInteger(limit) || limit < 1) {
                return next(
                    new ApiError(
                        400,
                        "Query parameter 'limit' must be a positive integer"
                    )
                );
            }
            if (limit > maxLimit) {
                return next(
                    new ApiError(
                        400,
                        `Query parameter 'limit' must not exceed ${maxLimit}`
                    )
                );
            }
        }

        req.pagination = {
            page,
            limit,
            skip: (page - 1) * limit,
        };

        return next();
    };
};

/* ──────────────────────────────────────────────────────────────
 * validateSorting
 *
 * Parses and validates ?sortBy and ?sortOrder query parameters.
 * Attaches req.sorting = { sortBy, sortOrder } for controllers.
 *
 * Options:
 *   allowedFields – column names permitted for sorting.
 *   defaultField  – fallback sortBy value.
 *   defaultOrder  – fallback sortOrder ('asc' | 'desc').
 * ──────────────────────────────────────────────────────────────*/
export const validateSorting = ({
    allowedFields = [],
    defaultField = "createdAt",
    defaultOrder = "desc",
} = {}) => {
    return (req, res, next) => {
        const rawSortBy = req.query.sortBy;
        const rawSortOrder = req.query.sortOrder;

        let sortBy = defaultField;
        let sortOrder = defaultOrder;

        if (rawSortBy !== undefined) {
            if (
                allowedFields.length > 0 &&
                !allowedFields.includes(rawSortBy)
            ) {
                return next(
                    new ApiError(
                        400,
                        `Query parameter 'sortBy' must be one of: ${allowedFields.join(", ")}`
                    )
                );
            }
            sortBy = rawSortBy;
        }

        if (rawSortOrder !== undefined) {
            const order = rawSortOrder.toLowerCase();
            if (order !== "asc" && order !== "desc") {
                return next(
                    new ApiError(
                        400,
                        "Query parameter 'sortOrder' must be 'asc' or 'desc'"
                    )
                );
            }
            sortOrder = order;
        }

        req.sorting = { sortBy, sortOrder };

        return next();
    };
};
