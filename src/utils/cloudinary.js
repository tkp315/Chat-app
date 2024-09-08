import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,  // Ensure URLs are HTTPS
});

const uploadOnCloudinary = async function (localFilePath,folder) {
  try {
    if (!localFilePath) {
      console.log("File Path on local storage is not found");
      return null;
    }

   console.log("this is file path",localFilePath);
    if (!fs.existsSync(localFilePath)) {
      console.log("File not found at path:", localFilePath);
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      use_filename: true,
      secure: true,
      resource_type: 'auto',  // Auto-detect file type
    });

    // Use fs.promises to delete the local file after upload
    await fs.promises.unlink(localFilePath);
    console.log("File is uploaded on Cloudinary:", response.secure_url);
    return response;
  } catch (error) {
    // Ensure the local file is deleted if there's an error
    if (fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath);
    }
    console.log(
      "File is not uploaded on Cloudinary and deleted from local storage also",
      error
    );
    return null;
  }
};

export { uploadOnCloudinary };
