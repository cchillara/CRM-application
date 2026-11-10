class ApiResponse {
    constructor(
        statusCode = 200,
        arg2 = null,
        arg3 = null,
        arg4 = "Success"
    ) {
        this.statusCode = statusCode;
        this.success = statusCode >= 200 && statusCode < 300;

        // Support both calling conventions:
        // 1. Standard: new ApiResponse(statusCode, data, message) -> 3 args
        // 2. Legacy:   new ApiResponse(statusCode, errors, data, message) -> 4 args
        if (Array.isArray(arg2)) {
            // (statusCode, errors, data, message)
            this.errors = arg2;
            this.data = arg3;
            this.message = typeof arg4 === "string" ? arg4 : "Success";
        } else if (typeof arg3 === "string") {
            // (statusCode, data, message)
            this.errors = [];
            this.data = arg2;
            this.message = arg3;
        } else {
            this.errors = [];
            this.data = arg3 !== null && arg3 !== undefined ? arg3 : arg2;
            this.message = typeof arg4 === "string" ? arg4 : "Success";
        }
    }
}

export { ApiResponse };
