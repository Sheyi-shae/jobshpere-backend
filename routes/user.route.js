import  { Router } from "express";
import { createUser, deleteUser, fetchUserById, fetchUsersByCompany, updateUser } from "../controllers/user.controller.js";
import { authenticateUser, authorizeRole, checkCompanyOwnership } from "../middlewares/auth.middleware.js";

const userRouter = Router();

//fetch all users in a company
userRouter.get('/all-users/:slug/:companyId',authenticateUser,checkCompanyOwnership,authorizeRole("admin"), fetchUsersByCompany);

//create new user
userRouter.post('/:slug/create', authenticateUser,checkCompanyOwnership, authorizeRole("admin"), createUser);

//update user
userRouter.patch('/update/:slug/:id', authenticateUser,checkCompanyOwnership,authorizeRole("admin"), updateUser);

//delete user
userRouter.delete('/delete/:slug/:id', authenticateUser,checkCompanyOwnership, authorizeRole("admin"), deleteUser);
//my profile
userRouter.get('/my-profile/:slug', authenticateUser, checkCompanyOwnership,fetchUserById);

export default userRouter;