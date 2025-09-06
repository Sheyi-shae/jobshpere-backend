

import Stripe from "stripe";
import db from "../libs/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//fetch all details in a company
export const fetchCompanyDetails = async (req, res,next) => {
  const { slug} = req.params;
    try {
       if(!slug) {
          const error = new Error('Company slug is required');
            error.status = 404;
            throw error;
       }
        const company = await db.company.findUnique({
            where: {slug },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        companyId: true,
                        role: true,
                        createdAt: true,
                       
                    }
                },
                applications: {
                    include: {
                      job: {
                        select: {
                          id: true,
                          title: true,
                          type: true,
                          location: true,
                        },
                      },
                    }
                  },
                jobPosts:{
                   include: {
                jobViews: true,
                user: {
                        select: {
                          id: true,
                          email:true,
                          role:true
                        },
                      },

                company:{
                  
                        select: {
                          id:true,
                          name:true
                        },
                      
                }
              }
                },
                activity:true
            },
        });
        //  //  //console.log(company);
        res.status(200).json({
            success: true,
            message: 'Users fetched successfully',
            data:company});
    }catch (error) {
        next(error);
    }
}

//update company details
export const updateCompanyDetails = async (req, res) => {
    const { slug } = req.params;
    const { name, description,  website, logo } = req.body;
try {
    if(!slug) {
        const error = new Error('Company slug is required');
        error.status = 404;
        throw error;
    }
    // Check if the company exists
    const existingCompany = await db.company.findUnique({
        where: { slug }
    });
    if (!existingCompany) {
        const error = new Error('Company not found');
        error.status = 404;
        throw error;
    }
    // Update the company
    const updatedCompany = await db.company.update({
        where: { slug },
        data: {
            name,
            description,
            website,
            logo
        }
    });     
    return res.status(200).json({
        success: true,
        message: 'Company updated successfully',
        data: updatedCompany
    });
    
} catch (error) {
    next(error);
    
}

}


//setup stripe customer and subscription
export const setupStripeCustomerAndSubscription = async (req, res, next) => {
  const { slug } = req.params;

  try {
    const company = await db.company.findUnique({
      where: { slug },
    });
   //  //  //console.log("👉 Company found:", company);
 
       if (!company || !company.stripeCustomerId) {
        const error = new Error('Company not found');
        error.status = 404;
        throw error;
    }


    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: company.stripeCustomerId,
      line_items: [
        {
          price: 'price_1ReZQkHD9MDUsSTQD5aMxkDR',
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/${slug}/dashboard/company-profile/subscription/payment-status?status=success`,
      cancel_url: `${process.env.FRONTEND_URL}/${slug}/dashboard/company-profile/subscription/payment-status?status=cancel`,
    });

      //console.log(session.url);
    return res.status(200).json({ success: true, url: session.url });

  } catch (error) {
     //console.error("Stripe setup error:", error);
next(error);

  }
}

//download invoice controller

export const getInvoice= async(req,res,next)=>{
   try {
    const invoices = await stripe.invoices.list({
      subscription: req.params.stripeSubscriptionId,
      limit: 1,
    });
    if (!invoices.data.length) {
      return res.status(404).json({ message: "No invoices found" });
    }
    const invoice = invoices.data[0];
    res.json({ pdf: invoice.invoice_pdf, url: invoice.hosted_invoice_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}



//publicly fetch all companies
export const fetchAllCompanies = async (req, res, next) => {
  try {
    
    const companies = await db.company.findMany({
      include: {
        //include active job posts
        jobPosts: {
          where: {
           isActive: true
          }
        }
      }
    });
  
    res.status(200).json({
      success: true,
      message: 'Companies fetched successfully',
      data: companies
    });
  } catch (error) {
    next(error);
  }
}



