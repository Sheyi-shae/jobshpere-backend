import { Router } from "express";
import { authenticateUser, authorizeRole, checkCompanyOwnership } from "../middlewares/auth.middleware.js";
import { fetchAllCompanies, fetchCompanyDetails, 
    getInvoice, 
    setupStripeCustomerAndSubscription, updateCompanyDetails } from "../controllers/company.controller.js";

const companyRouter = Router();

//fetch all details in a company
companyRouter.get("/:slug", authenticateUser,checkCompanyOwnership, fetchCompanyDetails);

//update company details
companyRouter.put("/:slug", authenticateUser, checkCompanyOwnership, authorizeRole("admin"),updateCompanyDetails)
//setup stripe customer and subscription
companyRouter.post("/:slug/subscribe", authenticateUser, checkCompanyOwnership, setupStripeCustomerAndSubscription);

//download stripe invoice
companyRouter.get("/:slug/invoice/:stripeSubscriptionId",authenticateUser,checkCompanyOwnership,getInvoice)
//fetch all companies - public
companyRouter.get("/",fetchAllCompanies)









export default companyRouter;