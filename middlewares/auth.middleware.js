import jwt from "jsonwebtoken";
import db from "../libs/db.js";

export const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. Please log in." });
  }
  

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            website: true,
            logo: true,
            createdAt: true,
            subscriptionStatus: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            subscriptionEndDate: true,
          },
        },
        
      },
    });
    
    console.log("logged in",user)

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = user; // Fresh user object
    req.companyId = user.companyId; 
    
   

    next();
  } catch (error) {
    return res.status(403).json({ message: "Please log in again." });
  }
};


export const authorizeRole = (roles) => {
  return (req, res, next) => {
    
    if (!roles.includes(req.user?.role)) {
      
      return res.status(403).json({ message: "Access denied. You do not have permission." });
    }
    next();
  };
};

// export const verifiedUser = (req, res, next) => {
//   if (!req.user?.isVerified) {
//     return res.status(403).json({ message: "Please verify your email first." });
//   }
//   next();
// };


// checkCompanyOwnership.js
export const checkCompanyOwnership = (req, res, next) => {
  const user = req.user;
  const companySlug = req.params.slug;

  if (user.company?.slug !== companySlug) {
    return res.status(403).json({ message: "You do not belong to this company." });
  }

  next();
};

//check company subscription status
export const checkCompanySubscription = async (req, res, next) => {
  const user = req.user;

  if (!user.company) {
    return res.status(403).json({ message: "Company not found." });
  }

  // Check if the company has an active subscription
  if (user.company.subscriptionStatus !== 'active') {
    return res.status(403).json({ message: "Your company does not have an active subscription." });
  }

  next();
}


