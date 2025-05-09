import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name:process.env.CLOUDINAREY_CLOUD_NAME, 
    api_key:process.env.CLOUDINAREY_API_KEY, 
    api_secret: process.env.CLOUDINAREY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const  uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        // console.log(`File has been uploaded on the url${response.url}`)
        fs.unlinkSync(localFilePath)
        return response;
    } catch (err) {
        fs.unlink(localFilePath);

        return null;        
    }
}

export {uploadOnCloudinary}
