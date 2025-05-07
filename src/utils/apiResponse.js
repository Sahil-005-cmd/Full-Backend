class ApiResponse{
    constructor(stausCode,data,message="Success"){
        this.stausCode = stausCode
        this.data = data
        this.success = stausCode < 400
    }
}