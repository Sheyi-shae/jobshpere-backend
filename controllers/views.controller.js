import db from '../libs/db.js';
import requestIp from 'request-ip';

export const trackJobView = async (req, res) => {
  const { slug, jobSlug } = req.params;
  const ip = requestIp.getClientIp(req);

  try {
    const company = await db.company.findUnique({ where: { slug } });
    const job = await db.jobPost.findFirst({
      where: { slug: jobSlug, companyId: company.id },
    });

    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Avoid duplicate views by IP
    await db.jobView.upsert({
      where: {
        jobId_ip: {
          jobId: job.id,
          ip,
        },
      },
      update: {}, // no update needed
      create: {
        jobId: job.id,
        ip,
      },
    });

    res.status(204).end(); 
  } catch (error) {
      //console.error(error);
    res.status(500).json({ message: 'View tracking failed' });
  }
};
