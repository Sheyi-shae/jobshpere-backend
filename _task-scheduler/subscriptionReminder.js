import db from "../libs/db.js";
import cron from "node-cron"
import sendEmailReminder from "../_emails/sendEmailReminder.js";

//run this function periodically to track subscription end dates and email reminders 3 days before end date
cron.schedule("0 7 * * *", async () => {
  // Runs every day at 7 AM
  const now = new Date();
  const upcoming = new Date();
  upcoming.setDate(now.getDate() + 3);//3 days from now

  try {
    const companies = await db.company.findMany({
      where: {
        subscriptionEndDate: {
          gte: now,
          lt: upcoming
        },
         
       
      },
      include: {
        users: true, 
      },
    });

    for (const company of companies) {
      const adminUsers = company.users.filter((u) => u.role === "admin");

      for (const admin of adminUsers) {
        await sendEmailReminder(
          admin.email,
          company.name,
          company.subscriptionEndDate
        );
      }
    }
    
  } catch (error) {
    //console.error("Error fetching companies:", error);
  }
});