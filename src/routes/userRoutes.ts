import express from 'express';
import { register, login } from '../controller/userController';

const router = express.Router();

// Register route
router.post('/register', register);
router.get('/',(req,res)=>{
    res.send("ankii")
})
// Login route
router.post('/login', login);

export default router;
