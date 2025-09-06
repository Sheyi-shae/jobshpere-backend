//slug === companySlug
import  { Router } from "express";
import { authenticateUser, checkCompanyOwnership } from "../middlewares/auth.middleware.js";
import postJobController, { deactivateJob, deleteJob, fetchJobBySlug, fetchJobsByCompany, fetchJobsByUser, fetchPublicJobBySlug, fetchPublicJobs, updateJob } from "../controllers/jobs.controller.js";
const jobsRouter = Router();



//post a job
jobsRouter.post("/:slug",authenticateUser,checkCompanyOwnership, postJobController);

//fetch all jobs in a company
jobsRouter.get("/:slug/company-jobs", authenticateUser, checkCompanyOwnership,fetchJobsByCompany )
//fetch all by logged in user
jobsRouter.get("/:slug/my-jobs", authenticateUser,fetchJobsByUser);
//fetch jobs by slug
jobsRouter.get("/:slug/:jobSlug/job-details", authenticateUser, checkCompanyOwnership,fetchJobBySlug)
//update a job
jobsRouter.put("/:slug/update-job/:jobSlug", authenticateUser, checkCompanyOwnership, updateJob);

//deactivate a job
jobsRouter.put("/:slug/deactivate-job/:jobSlug", authenticateUser, checkCompanyOwnership, deactivateJob);
    
//delete a job
jobsRouter.delete("/:slug/delete-job/:jobSlug", authenticateUser, checkCompanyOwnership,deleteJob);
 
//fetching,Searching and Filtering public jobs without authentication
jobsRouter.get("/public-jobs", fetchPublicJobs);
//fetch public jobs by slug
jobsRouter.get("/:slug/public-jobs", fetchPublicJobBySlug);


export default jobsRouter;