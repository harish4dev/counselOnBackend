import express from 'express';
import { register, login , userProfile, logout} from '../controller/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

router.get('/userProfile',authenticate,userProfile)
// Profile route
router.get('/logout',logout)
export default router;
