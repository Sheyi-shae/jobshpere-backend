import newAccountEmail from "../_emails/new-account.js";
import db from "../libs/db.js";
import { generatePassword } from "../libs/generatePassword.js";

import bycrypt from 'bcryptjs';
//fetch all users
export async function fetchAllUsers(req, res, next) {
    try {
        const users = await db.user.findMany({
            include: {
                company: true, 
                jobPost: true,
                
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }

}


//fetch all users by company id
export async function fetchUsersByCompany(req, res, next) {
    const { companyId } = req.params;

    try {
       const users = await db.user.findMany({
  where: { companyId },
  select: {
    id: true,
    email: true,
    companyId: true,
    role:true,
    createdAt: true,
    updatedAt: true,
    company: true,
    jobPost: true,
    // do NOT select password
  },
  orderBy: { createdAt: 'desc' }
});


        return res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
}

//create new user
export async function createUser(req, res, next) {
const { email, role, companyId,companyName } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            const error = new Error('User already exists');
            error.status = 400;
            throw error;
        }

        const password = generatePassword();
        // Hash the password
        const hashedPassword = await bycrypt.hash(password, 10);

        // Create the user
        const user = await db.user.create({
            data: {
                email,
                password: hashedPassword,
              
                role, 
                companyId,
            }
        });
        const ctaLink=`${process.env.FRONTEND_URL}/pre-login`
        //send email
        await newAccountEmail(email, password, companyName,ctaLink);
        //update activity
        await db.activity.create({
        data: {
            type: 'CREATED_NEW_USER',
            user:'admin',
            companyId,
            action: `Added new user:${user.email}`
        }
        });

        return res.status(201).json({
            success: true,
            message: 'Successful! Login credentials have been sent to the user\'s email.',
            data: user
        });
    } catch (error) {
        next(error);
    }

}
//update user details by id
export async function updateUser(req, res, next) {
    const { id } = req.params;
    const {  role } = req.body;

    try {
        // Check if the user exists
        const existingUser = await db.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }

        // Update the user
        const updatedUser = await db.user.update({
            where: { id },
            data: {
                
                role,
                   }})

           return res.status(201).json({
            success: true,
            message: 'User updated successfully',
            data: updateUser
        });
    } catch (error) {
        next(error);
    }
}

//delete user by id
export async function deleteUser(req, res, next) {
    const { id } = req.params;

    try {
        // Check if the user exists
        const existingUser = await db.user.findUnique({
            where: { id },
           
        });

        if (!existingUser) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }
        
        //check if admin users are more than 1 in a company
        const adminUsers = await db.user.count({
            where: { companyId: existingUser.companyId, role: 'admin' }
        });

        if (adminUsers <= 1) {
            const error = new Error('Cannot delete the last admin user');
            error.status = 400;
            throw error;
        }

        const user = await db.user.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
}

//fetch user by id
export async function fetchUserById(req, res, next) {
    const { id } = req.params;

    try {
        const user = await db.user.findUnique({
            where: { id },
            include: {
                company: true, 
                jobPost: true,
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}

//fetch user profile
export async function fetchUserProfile(req, res, next) {
    const userId = req.user.id;

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                company: true, 
                jobPost: true,
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}