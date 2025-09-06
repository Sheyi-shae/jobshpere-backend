import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import dotenv from 'dotenv';
import errorHandler from './middlewares/error.middleware.js';
import { PrismaClient } from './generated/prisma/index.js'
import authRouter from './routes/auth.route.js';
import jobsRouter from './routes/jobs.route.js';
import viewsRouter from './routes/views.route.js';
import applicationRouter from './routes/application.route.js';
import userRouter from './routes/user.route.js';
import companyRouter from './routes/company.route.js';
import { apiLimiter } from './middlewares/ratelimit.middleware.js';
import webhookRouter from './routes/webhook.stripe.route.js';
import uploadRouter from './routes/upload.route.js';
//task schedulers
import './_task-scheduler/subscriptionReminder.js'
import './_task-scheduler/subscriptionStatusUpdater.js'





//load env
dotenv.config();
const prisma = new PrismaClient();

const app = express();
// Middleware

const allowedOrigins = ['https://jobshpere-frontend-dse6.vercel.app'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, 
  })
);



app.use(cookieParser());
//  Mount webhook before global express.json
app.use('/api/stripe/webhook', webhookRouter);
   
app.use(express.json()); //parse json request body
app.use(express.urlencoded({ extended: false }));
 
 
 //prevent api route spam 
 app.use(apiLimiter)
//routes
app.use('/api/auth',authRouter);
app.use('/api/jobs',jobsRouter);
app.use('/api/views',viewsRouter)
app.use('/api/application',applicationRouter);
app.use('/api/user',userRouter)
app.use('/api/company', companyRouter);
app.use('/api/upload', uploadRouter);




//db connect check
async function checkDB() {
    try {
      await prisma.$connect();
     // console.log('Database connected successfully');
      
    } catch (error) {
    //  console.error('Database connection failed:', error);
      process.exit(1); // Exit the process with failure
    }
  }
  checkDB();

//error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
//  console.log(`Server running on http://localhost:${PORT}`);
});
