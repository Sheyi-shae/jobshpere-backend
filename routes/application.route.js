import  { Router } from "express";
import { aiResumeAnalyzer, applyForJob, fetchApplicationsByCompany, fetchApplicationsByUser, processResumeScoring, updateApplicationStatus,} from "../controllers/application.controller.js";
import { authenticateUser, checkCompanyOwnership, checkCompanySubscription } from "../middlewares/auth.middleware.js";

const applicationRouter = Router();

//post a job application
applicationRouter.post('/apply', applyForJob)


//fetch all applications by job slug

//fetch all applications by company slug
applicationRouter.get('/:slug',authenticateUser,checkCompanyOwnership, fetchApplicationsByCompany)

//fetch all applications by user id
applicationRouter.get('/applications/user', authenticateUser, fetchApplicationsByUser)

//score resume against job description
applicationRouter.post('/score', authenticateUser,checkCompanySubscription, processResumeScoring);

//update application status
applicationRouter.put('/:slug/update-status', authenticateUser, checkCompanyOwnership, updateApplicationStatus);

//ai resume analyzer for public
applicationRouter.post('/public/score', aiResumeAnalyzer);






export default applicationRouter;