## JobSphere

JobSphere is a multi-tenant SaaS job board platform that allows companies to post jobs, manage applications, and streamline their hiring process. Built with Next.js (frontend) and Node.js + Prisma + MongoDB (backend), it supports subscription billing via Stripe and offers AI-powered resume analysis (premium feature) using Cohere.

## ✨ Features
- **Multi-Tenant SaaS** – Path-based multi-tenancy for different organizations.  
- **Job Management** – Post, edit, and manage job listings.  
- **Applications Dashboard** – Track and review candidate applications.  
- **AI Resume Analysis** – Paid subscribers get instant AI-driven candidate insights.  
- **Authentication** – Secure global login portal with JWT.  
- **Subscription Plans** – Stripe-powered recurring billing (e.g., $29/month).  
- **Email Notifications** – Automated email alerts for job applications and status updates.  


🛠️ Tech Stack


Backend: Node.js, Express, Prisma, MongoDB

Payments: Stripe (Subscriptions)

AI Integration: Cohere API

File Storage: Cloudinary

## 🚀 Getting Started -Prerequisites

Node.js (v18+)

 npm

MongoDB (local or Atlas)

Stripe account

Cohere API key

Cloudinary account


## Environment Variables

Create a .env file 

DATABASE_URL=""
JWT_SECRET=
JWT_EXPIRES_IN=
FRONTEND_URL=

#node mode
NODE_ENV=production
#huggingface AI
HUGGINGFACE_API_KEY=
COHERE_API_KEY=

#email
EMAIL_PASS=
EMAIL_USER=

#Cloudinary configuration


CLOUDINARY_CLOUD_NAME=dnig0vzik
CLOUDINARY_API_KEY=468579865981319
CLOUDINARY_API_SECRET=EmNeMlak0PkZGx0Zrf5DFiQYrdk
CLOUDINARY_URL=cloudinary://468579865981319:EmNeMlak0PkZGx0Zrf5DFiQYrdk@dnig0vzik

#Stripe configuration
STRIPE_WEBHOOK_SECRET=
STRIPE_SECRET_KEY=_test_51ReYQHHD9MDUsSTQFKa73oXowMg5fuFsKEh4yoQJbAUANfpMXgiIwjp2wrVLdxNqlvpcHqsHWhH6wrNGdnacMnR000CvqtZdQA

## 📌 Roadmap

 Employer branding pages

 Candidate insights dashboard

 Advanced analytics for recruiters

 Role-based access (Admin/Recruiter/HR)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open a pull request or create an issue.

## 📜 License

This project is licensed under the MIT License.

## ⚡ JobSphere – Simplifying hiring with AI and SaaS.