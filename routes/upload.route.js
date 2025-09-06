import { Router } from 'express';
import { companyLogoUpload, upload } from '../libs/multerConfig.js';
import { authenticateUser, checkCompanyOwnership } from '../middlewares/auth.middleware.js';


const uploadRouter = Router();


uploadRouter.post("/", upload.single("file"), (req, res) => {
  //console.log('MIME type:', req.file.mimetype);
  
    try {
      res.json({ url: req.file.path });
      
    } catch (error) {
      res.status(500).json({ error: "File upload failed" });
    }
  });


  //upload company logo
  uploadRouter.post("/:slug/company",authenticateUser, checkCompanyOwnership, companyLogoUpload.single("file"), (req, res) => {
  //console.log('MIME type:', req.file.mimetype);
  
    try {
      res.json({ url: req.file.path });



      
    } catch (error) {
      res.status(500).json({ error: "File upload failed" });
    }
  });

export default uploadRouter;