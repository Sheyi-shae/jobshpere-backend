
import db from '../libs/db.js';
import jwt from 'jsonwebtoken';
import bycrypt from 'bcryptjs';
import slugify from '../libs/slugify.js';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//first regustration
export default async function companyAndUserAuth(req,res,next) {
    

   const { companyName, email, password } = req.body;
   const slug = slugify(companyName);
   
    
    try {
        // Check if the company already exists
        const existingCompany = await db.company.findUnique({
            where: { slug}
        });
        if (existingCompany ) {
            const error = new Error('Company with this name already exists');
            error.status = 409;
            throw error;
        }
        //check if the user already exists
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser ) {
            const error = new Error('Email already exists');
            error.status = 409;
            throw error;
        }
  
              // 1. Create company
            const company = await db.company.create({
            data: {
                name: companyName,
                slug,
            }
            });

                //  create customer in stripe
                const stripeCustomer = await stripe.customers.create({
                email,
                name: companyName,
                metadata: {
                    companyId: company.id,
                    slug: company.slug,
                }
                });

                //update company with stripe customer id
                await db.company.update({
             where: { id: company.id },
           data: { stripeCustomerId: stripeCustomer.id }
});
            //hash the password
         const salt = await bycrypt.genSalt(10);
                const hashedPassword = await bycrypt.hash(password, salt);

            
            const user = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'admin', 
                companyId: company.id,
            }
            });
       //Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // ✅ Set cookie
    res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});


    // Exclude password before sending
const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user:userWithoutPassword,
      slug:company.slug
    });
  } catch (error) {
    
    next(error); // send to error middleware
  }

}

//user registration by admin
export async function userRegistrationByAdmin(req, res, next) {
    const { email, password, companyId } = req.body;
    
    try {
        // Check if the user already exists
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            const error = new Error('Email already exists');
            error.status = 409;
            throw error;
        }

        // Hash the password
        const salt = await bycrypt.genSalt(10);
        const hashedPassword = await bycrypt.hash(password, salt);

        // Create the user
        const user = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'user', // Default role for new users
                companyId,
            }
        });

        return res.status(201).json({
            success: true,
            message: 'User registration successful',
            data: user
        });
    } catch (error) {
        next(error);
    }
}

//user login
export async function lookUpcompanyViaUserEmail(req, res, next) {
    const {email} = req.body;
    try {
        // Check if the user exists
        const user = await db.user.findUnique({
            where: { email },
            include: { company: true } // Include company details
        });

        if (!user) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }


        return res.status(200).json({
            success: true,
            message: 'User found',
            slug: user.company.slug,
            companyId: user.company.id,
            userEmail:user.email


        });
    }catch (error) {
        next(error);
    }
}

//user login after prelogin
export async function userLogin(req, res, next) {
    
    const { email, password,slug } = req.body;
   

    try {
        //check if slug exists
        const company = await db.company.findUnique({
            where: { slug }
        });
        if (!company) {
            const error = new Error('Company does not exist');
            error.status = 404;
            throw error;
        }
        // Check if the user exists
         const user = await db.user.findFirst({
            where: {
             email,
            companyId: company.id,
             },
            include: { company: true } 
        });

        if (!user) {
            const error = new Error('Invalid login credentials');
            error.status = 401;
            throw error;
        }

        // Check password
        const isPasswordValid = await bycrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Invalid password');
            error.status = 401;
            throw error;
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        // Set token in httpOnly cookie
            res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });



        // Exclude password before sending
const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            slug: user.company.slug,
            user:userWithoutPassword

        });
    } catch (error) {
        next(error);
    }
}



  