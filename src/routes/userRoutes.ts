import express from 'express';
import { register, login , userProfile, logout, verifyEmail, forgotPassword, resetPassword} from '../controller/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Profile route
router.get('/userProfile',authenticate,userProfile)

//logout end point 
router.get('/logout',logout)

//Email verification end point
router.get('/verify-email',verifyEmail)

//forgot Password  end point
router.post('/forgot-password', forgotPassword);

//Reset password
router.post('/reset-password',resetPassword)
export default router;
