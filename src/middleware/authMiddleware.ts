import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db'

interface AuthRequest extends Request {
  user?: { userId: number };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number };
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (!user.verified) {
      res.status(403).json({ message: 'Please verify your email before accessing this resource' });
      return;
    }

    req.user = { userId: user.id };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};