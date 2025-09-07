
import db from '../libs/db.js';
import slugify from '../libs/slugify.js';

export  default async function postJobController(req, res,next) {
    const { title, description, location, type,salaryMin,salaryMax,tags,isActive} = req.body;
    //  //  //console.log("req.body",req.body)
    const companyId = req.companyId; 
    const userId = req.user.id; 
    const slug = slugify(title); 
    
    try {
        // Check if the job already exists
        const existingJob = await db.jobPost.findUnique({
            where: { slug }
        });
        
        if (existingJob) {
            const error = new Error('Job with this title already exists');
            error.status = 409;
            throw error;
        }

        // Create the job
        const job = await db.jobPost.create({
            data: {
                title,
                description,
                location,
                salaryMin,
                salaryMax,
                slug: slug+Date.now(),
                companyId,
                userId,
                tags: tags || [],
                isActive: isActive !== undefined ? isActive : true, 
                type
            }
        });
        //update activity
        await db.activity.create({
        data: {
            type: 'JOB_POSTED',
            user:'system',
            companyId,
            jobId: job.id,
            action: `New job posted: ${title}`
        }
        });


        return res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            data:job
        });
    } catch (error) {
        next(error);
    }
    
} 
//fetch all jobs in a company
export async function fetchJobsByCompany(req, res, next) {
    const companyId = req.companyId; 
    try {
        const jobs = await db.jobPost.findMany({
            where: { companyId },
            include: {
                user:true,
                company: true,
                jobViews: true,
                applications:true
            },
            orderBy: { createdAt: 'desc' }
        });

        
        return res.status(200).json({
            success: true,
            data:jobs
        });
    } catch (error) {
        next(error);
    }
}


//fetch all jobs by logged in user
export async function fetchJobsByUser(req, res, next) {
    const userId = req.user.id; 
    try {
        const jobs = await db.jobPost.findMany({
            where: { userId },
            include: {
                user:true,
                company: true,
                jobViews: true,
                application:true
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
           data: jobs
        });
    } catch (error) {
        next(error);
    }
}

//fetch jobs by slug
export async function fetchJobBySlug(req, res, next) {
    const jobSlug = req.params.jobSlug;

    try {
        const job = await db.jobPost.findUnique({
            where: { slug: jobSlug },
            include: {
                user:true,
                company: true,
                jobViews: true,
                applications:true
            }
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: job
        });
    } catch (error) {
        next(error)
    }
}

//update a job
export async function updateJob(req, res, next) {
    const {jobSlug} = req.params; 
    const { title, description, location, type,salaryMin,salaryMax,tags,isActive} = req.body;
    try {
        //do not change the slug if the title is not changed
        const existingJob = await db.jobPost.findUnique({
            where: { slug : jobSlug }
        });
          // Determine whether to update the slug
    const shouldUpdateSlug =
      title && slugify(title) !== existingJob.slug.split("-")[0];

    const updatedSlug = shouldUpdateSlug
      ? slugify(title) + Date.now()
      : existingJob.slug;
        const job = await db.jobPost.update({
            where: { slug:jobSlug},
            data: {
                title,
                description,
                location,
                salaryMin,
                salaryMax,
                slug: updatedSlug, 
                tags: tags || [],
                isActive: isActive !== undefined ? isActive : true, 
                type
            }
        });

        //fetch job details
        const jobDetails = await db.jobPost.findUnique({
            where: { slug: job.slug },
            include: {
                user:true,
                company: true,
                jobViews: true,
                applications:true
            }
        });
        //update activity
        await db.activity.create({
        data: {
            type: 'JOB_UPDATED',
            user: jobDetails.user.email,
            companyId: jobDetails.company.id,
            jobId: jobDetails.id,
            action: ` updated: ${title}`
        }
        });

        return res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            data:job
        });
    } catch (error) {
        next(error);
    }
}
//deactivate a job
export async function deactivateJob(req, res, next) {
    const {jobSlug} = req.params; 
    try {
        const job = await db.jobPost.update({
            where: { slug:jobSlug},
            data: {
                isActive: false
            }
        });
        
        //fetch job details
        const jobDetails = await db.jobPost.findUnique({
            where: { slug: job.slug },
            include: {
                user:true,
                company: true,
               
            }
        });
        //update activity
        await db.activity.create({
        data: {
            type: 'JOB_UPDATED',
            user: jobDetails.user.email,
            companyId: jobDetails.company.id,
            jobId: jobDetails.id,
            action: ` Moved ${title} to draft`
        }
        });

        return res.status(200).json({
            success: true,
            message: 'Job deactivated successfully',
            data: job
        });
    } catch (error) {
        next(error);
    }
}
//delete a job
export async function deleteJob(req, res, next) {
    const {jobSlug} = req.params
 
    
    try {
        const job = await db.jobPost.delete({
            where: { slug: jobSlug }
        });

        return res.status(200).json({
            success: true,
            message: 'Job deleted successfully',
            data: job
        });
    } catch (error) {
        next(error);
    }
}



//fetching,Searching and Filtering public jobs
export async function fetchPublicJobs(req, res, next) {
  const { search = '', page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  const searchTerm = search.toLowerCase();

  try {
    const where = {
      isActive: true,
      OR: [
        {
          title: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          tags: {
            has: searchTerm
          }
        }
      ]
    };

    const jobs = await db.jobPost.findMany({
      where,
      include: {
        user: {
            select: {
                id:true,
                email: true,
                role :true,
                  createdAt:true, 
                  companyId :true
 
            }
        },
        company: true,
        jobViews: true,
        applications: true
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    
    const totalJobs = await db.jobPost.count({ where });

    return res.status(200).json({
      success: true,
      data: jobs,
      totalJobs,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    next(error);
  }
}

//Paginated Public Listing
// export async function fetchPaginatedPublicJobs(req, res, next) {
//     const { page = 1, limit = 10 } = req.query;
//     const skip = (page - 1) * limit;
    
//     try {
//         const jobs = await db.jobPost.findMany({
//         where: { isActive: true },
//         include: {
//             user: true,
//             company: true,
//             jobViews: true,
//             application: true
//         },
//         skip,
//         take: parseInt(limit),
//         orderBy: { createdAt: 'desc' }
//         });
    
//         const totalJobs = await db.jobPost.count({ where: { isActive: true } });
    
//         return res.status(200).json({
//         success: true,
//         data: jobs,
//         totalJobs,
//         totalPages: Math.ceil(totalJobs / limit),
//         currentPage: parseInt(page)
//         });
//     } catch (error) {
//         next(error);
//     }
//     }

//fetch jobs by slug
export async function fetchPublicJobBySlug(req, res, next) {
    const slug = req.params.slug; 
    try {
        const job = await db.jobPost.findUnique({
            where: { slug },
            include: {
                user:true,
                company: true,
                jobViews: true,
                applications:true
            }
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        

        return res.status(200).json({
            success: true,
            data: job
        });
    } catch (error) {
        next(error);
    }
}