class ApiResponse{
    constructor( statusCode = 200,errors=[],data=null, message = 'Success', ) {
        
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode >= 200 && statusCode < 300; // success is true if the status code is between 200 and 299
    
        this.errors = errors;
    }
}
export {ApiResponse}
