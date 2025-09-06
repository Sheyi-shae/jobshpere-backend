
import applicationStatusEmail from "../_emails/application-status-email.js";
import { applicationStatusMessages } from "../_emails/applicationStatusMessage.js";
import db from "../libs/db.js";
import { extractResumeTextFromUrl } from "../libs/resumeTextEtractor.js";
import { scoreResumeAgainstJD } from "../libs/scoreResume.js";


// Apply for a job
export async function applyForJob(req, res, next) {
    const {fullName,  resumeUrl,message  , email,coverLetter,companyId, phone, jobId} = req.body;
    try {
        //check if resumeurl, email and jobId exists in the same application
        const existingApplication = await db.application.findFirst({
            where: {
                
                email,
                jobId
            }
        });
        if (existingApplication) {
            const error = new Error('You have already applied for this job ');
            error.status = 409;
            throw error;
        }
        //fetch job details with jobId
        //fetch job details with jobId
          const job = await db.jobPost.findUnique({
            where: { id: jobId }
          });
        const application = await db.application.create({
            data: {
                fullName,
                email,
                resumeUrl,
                message,
                coverLetter,
                phone,
                jobId,
                companyId
            }
            })
            //send email
            await applicationStatusEmail(email,fullName)
             //update activity
                await db.activity.create({
          data: {
            type: 'APPLIED',
            user: `${fullName}`,
            jobId,
            companyId,
            action: `Applied for job: ${job?.title}`
          }
        });
        
        res.status(201).json({
            success: true,
            message: "Application submitted successfully",
            data: application
        });
    } catch (error) {
        next(error);
    }
}


//fetch all applications by for a company
export async function fetchApplicationsByCompany(req, res, next) {
   
    const companyId = req.companyId; 
    try {
        const applications = await db.application.findMany({
            where: { companyId },
            include: {
                company: true,
                job:{
                    include:{
                        user:true,
                        jobViews:true

                    }

                },
            
            },
            orderBy: { createdAt: 'desc' }
        });

    
        return res.status(200).json({
            success: true,
            data: applications
           
        });
    } catch (error) {
        next(error);
    }
}


//fetch all applications by user id
export async function fetchApplicationsByUser(req, res, next) {
    const userId = req.user.id; 
    try {
        const applications = await db.application.findMany({
            where: { userId },
            include: {
                company: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            data: applications
        });
    } catch (error) {
        next(error);
    }
}



//resume score against job description

export async function processResumeScoring(req, res, next) {
  try {
    const { jobId,email, resumeUrl } = req.body;

   //   //  //  //console.log("Processing resume scoring for:", { jobId, email, resumeUrl });
    // Validate input
    if (!jobId || !resumeUrl) {
      const error = new Error('Missing required fields: jobId and resumeUrl');
      error.status = 400;
      throw error;
    }

    // Validate URL format
    try {
      new URL(resumeUrl);
    } catch (err) {
      const error = new Error('Invalid resume URL format');
      error.status = 400;
      throw error;
    }

    // Fetch job with transaction to ensure data consistency
    const job = await db.jobPost.findUnique({
      where: { id: jobId },
      include: { company: true },
    });
    const companyId=job.company.id

    if (!job) {
      const error = new Error('Job not found');
      error.status = 404;
      throw error;
    }

    // Extract text with timeout
    let resumeText;
    try {
      resumeText = await Promise.race([
        extractResumeTextFromUrl(resumeUrl),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Please check your internet connection')), 30000)
        )
        
      ]);
     
      
    } catch (err) {
      const error = new Error(`Failed to extract resume text: ${err.message}`);
      error.status = 422;
      throw error;
    }

    // Score resume
    const { score, explanation } = await scoreResumeAgainstJD(
      resumeText,
      job.description
    );

    
    // Determine status (consider making thresholds configurable)
    const status = score >= 70 ? "shortlisted" : "screened_out";

    // Update application with transaction
    const application = await db.$transaction(async (tx) => {
      const existingApp = await tx.application.findUnique({
        where: { jobId_email_resumeUrl: { jobId, email, resumeUrl } }
      });

      if (!existingApp) {
        throw new Error('Application not found');
      }

      return tx.application.update({
        where: { jobId_email_resumeUrl: { jobId, email, resumeUrl } },
        data: { 
          aiScore: score, 
          aiExplanation: explanation, 
          isAnalyzed: true, 
          status,
          
        },
      });
    });

    //create activity
    await db.activity.create({
  data: {
      type: status === "shortlisted" ? "SHORTLISTED" : "SCREENED_OUT",
      user: application.fullName,
      jobId,
      companyId,
      action: status === "shortlisted" 
        ? "Application was shortlisted" 
        : "Application was screened out"
    }
});
    res.status(200).json({
      success: true,
      data: application,
      message: "Resume scoring completed successfully",
    });
  } catch (err) {
    next(err);
  }
}

//update application manaully status
export async function updateApplicationStatus(req, res, next) {
   
    const { status,id } = req.body;
    try {
        const application = await db.application.update({
            where: { id },
            data: { status }
        });
        //send email
        await applicationStatusEmail(application.email,application.fullName,applicationStatusMessages[status],)

        //create activity
        await db.activity.create({
            data: {
                type: status === "shortlisted" ? "SHORTLISTED" : "SCREENED_OUT",
                user: application.fullName,
                jobId: application.jobId,
                companyId: application.companyId,
                action: status === "shortlisted"
                    ? "Application was shortlisted"
                    : "Application was screened out"
            }
        });
        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        next(error);
    }
}




//ai resume reviewer for public

export async function aiResumeAnalyzer(req, res, next) {
  try {
    const { jobDescription,resumeUrl } = req.body;

   //   //  //  //console.log("Processing resume scoring for:", { jobId, email, resumeUrl });
    // Validate input
    if (!jobDescription || !resumeUrl) {
      const error = new Error('Missing required fields: job description and resumeUrl');
      error.status = 400;
      throw error;
    }

    // Validate URL format
    try {
      new URL(resumeUrl);
    } catch (err) {
      const error = new Error('Invalid resume URL format');
      error.status = 400;
      throw error;
    }
    // Extract text from resumeUrl with timeout
    let resumeText;
    try {
      resumeText = await Promise.race([
        extractResumeTextFromUrl(resumeUrl),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Please check your internet connection')
      
      ), 30000)
        )
        
      ]);
     
    
    } catch (err) {
      const error = new Error(`Failed to extract resume text: ${err.message}`);
      error.status = 422;
      throw error;
    }

    // Score resume
    const { score} = await scoreResumeAgainstJD(
      resumeText,
      jobDescription
    );

      //  //  //console.log("AI Resume Analysis Score:", score);
   
    res.status(200).json({
      success: true,
      data: score,
      message: "Your resume has been successfully analyzed",
    });
  } catch (err) {
    next(err);
  }
}