import db from "./libs/db.js";

async function flushDB() {
  
  await db.jobView.deleteMany(); 
   await db.application.deleteMany();
  await db.jobPost.deleteMany();
   await db.activity.deleteMany();
   await db.user.deleteMany();

    await db.company.deleteMany();
  
 
 
  // repeat for all models
  //console.log("✅ Database flushed");
}

flushDB().catch(console.error).finally(() => db.$disconnect());
