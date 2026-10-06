class ApiResponse{
    constructor( statusCode = 200,errors=[],data=null, message = 'Success', ) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode >= 200 && statusCode < 300;
        this.errors = errors;
    }
}
export {ApiResponse}
