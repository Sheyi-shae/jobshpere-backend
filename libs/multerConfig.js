import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Validate environment variables
["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].forEach((key) => {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Always use HTTPS
});

const sanitizeFileName = (filename) => 
  filename.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
  //  console.log("Uploading file:", file.originalname, "MIME type:", file.mimetype);

    const isDocument = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ].includes(file.mimetype);

    const publicId = `${Date.now()}-${sanitizeFileName(file.originalname)}`; // Remove extension
    
    return {
      folder: "Jobsphere_resumes",
      resource_type: isDocument ? "raw" : "image",
      public_id: publicId,
      invalidate: true, // Force CDN cache invalidation
      type: "upload", // Ensure public access
      ...(isDocument ? {} : { allowed_formats: ["jpg", "jpeg", "png", "gif"] }),
      format: isDocument ? undefined : 'auto', // Let Cloudinary determine format for images
      tags: ['resume', `type_${file.mimetype.split('/').pop()}`] // Add useful tags
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Only allow single file uploads
  }
});

// Utility function to invalidate cache for a specific file
const invalidateCache = async (publicId, resourceType = 'raw') => {
  try {
    await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      resource_type: resourceType,
      invalidate: true
    });
   // console.log(`Successfully invalidated cache for ${publicId}`);
    return true;
  } catch (error) {
   // console.error(`Error invalidating cache for ${publicId}:`, error);
    return false;
  }
};



//company logo upload can be added here similarly
const companyLogoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const publicId = `${Date.now()}-${sanitizeFileName(file.originalname)}`; // Remove extension
    return {
      folder: "Jobsphere_company_logos",
      public_id: publicId,
      type: "upload", // Ensure public access
      allowed_formats: ["jpg", "jpeg", "png", "gif"],
      format: 'auto', // Let Cloudinary determine format for images
      tags: ['company_logo'] // Add useful tags
    };
  },
});
 
const companyLogofileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/jpg"
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed.`), false);
  }
};

const companyLogoUpload = multer({
  storage: companyLogoStorage,
  companyLogofileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Only allow single file uploads
  }
});




export { upload, companyLogoUpload,  cloudinary, invalidateCache };