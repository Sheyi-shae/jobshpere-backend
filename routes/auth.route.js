import { Router } from 'express';
import companyAndUserAuth,{ lookUpcompanyViaUserEmail, userLogin } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';


const authRouter = Router();

//authRouter.post('/sign-up', signupController);
authRouter.post('/register', companyAndUserAuth);

//prelogin route
authRouter.post('/prelogin',lookUpcompanyViaUserEmail )
//user login route
authRouter.post('/:slug/login', userLogin);

//logout route
authRouter.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // important for HTTPS
        sameSite: 'strict',
       
    });

    res.status(200).json({ success: true, message: 'Logout successful' });
});


//check auth status
authRouter.get("/user", authenticateUser, async (req, res) => {
    res.status(200).json({ success: true, user: req.user });
});


export default authRouter;