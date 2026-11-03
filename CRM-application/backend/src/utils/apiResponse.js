class ApiResponse{
    constructor(statusCode = 200, errorsOrData = [], dataOrMessage = null, message = 'Success') {
        // Keep the existing four argument form used by client-admin routes while
        // also supporting the three argument (status, data, message) form used
        // by the auth and Super Admin controllers.
        const compactForm = arguments.length === 3 && typeof dataOrMessage === 'string';
        const errors = compactForm ? [] : errorsOrData;
        const data = compactForm ? errorsOrData : dataOrMessage;
        if (compactForm) message = dataOrMessage;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode >= 200 && statusCode < 300;
        this.errors = errors;
    }
}
export {ApiResponse}
