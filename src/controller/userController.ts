import { Request, Response } from 'express';
import { registerUser, loginUser, getUserById } from '../services/userService';

interface AuthRequest {
  user?:{userId:number}
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await registerUser(email, password);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { token } = await loginUser(email, password);
    res.cookie('token', token, {
      httpOnly: true, // Prevent JavaScript from accessing it
      secure: process.env.NODE_ENV === 'production', // Only send cookie on HTTPS in production
      sameSite: 'lax', // Prevent CSRF attacks // enable it when you are in production 
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    res.status(400).json({ message: error});
  }
};

export const userProfile = async ( req :Request, res:Response) =>{
  try{
    const userId = (req as AuthRequest).user.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  }catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
}

// logout 

export const logout =(req:Request ,res:Response)=>{
  try{
    res.clearCookie('token');
    res.status(200).json({message:"logged out sucessfully"})
  }
  catch(error){
    res.status(400).json({ message: error.message });
  }
}