import db from "../libs/db.js";
import cron from "node-cron"
import subscriptionStatusEmail from "../_emails/subscriptionStatusEmail.js";

//track subscription where  end date is today and status is active, then change status to inactive
cron.schedule("0 0 * * *", async () => {

  const now = new Date();

  try {
    const companies = await db.company.findMany({
      where: {
        subscriptionEndDate: {
          lte: now,
          },
         subscriptionStatus : "active"
      },
      include: {
        users: true, 
      },
       
      })
    
      //update status to inactive
      for (const company of companies) {
        await db.company.update({
          where: {
            id: company.id,
          },
          data: {
            subscriptionStatus: "inactive",
            subscriptionEndDate: null,
          },
        });
      }

    for (const company of companies) {
      const adminUsers = company.users.filter((u) => u.role === "admin");

      for (const admin of adminUsers) {
        await subscriptionStatusEmail(
          admin.email,
          company.name,
      
        );
      }
    }
    
  } catch (error) {
   // console.error("Error fetching companies:", error);
  }
});