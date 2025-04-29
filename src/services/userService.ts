import bcrypt from 'bcrypt';
import prisma from '../config/db';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer'
import { error } from 'console';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});


// Register User (Sign-Up)
export const registerUser = async (email: string, password: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if(existingUser && existingUser.verified){
    return "User already exists pls login"
  }

  if (existingUser) {
    sendVerificationEmail(existingUser.id,existingUser.email)
    return "Register Successfull Pls verify our email to get started";
  }
  

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
  sendVerificationEmail(newUser.id,newUser.email)
  return "Register Successfull Pls verify our email to get started";
};

// Login User (Issue JWT Token )
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  // Create a JWT token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });


  return { token };
};

//get user by id
export const getUserById = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true }, // You can customize fields here
  });

  return user;
};

export const verifyUserEmail = async ( userId : number)=>{
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("user not found")

    if (user.verified) throw new Error('Email already verified');

    await prisma.user.update({
      where: { id: userId },
      data: { verified: true },
    });
    return true;
}
catch(err){
return false;
}
}

const sendVerificationEmail=async(userID:number,email:string)=>{
  try{
    const token = jwt.sign(
      { userId: userID },
      process.env.JWT_EMAIL_SECRET,
      { expiresIn: '1d' }
    );
  
    const link = `${process.env.BASE_URL}/user/verify-email?token=${token}`;
  
    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Verify your email',
      html: `<p>Click <a href="${link}">here</a> to verify your email.</p>`,
    });
  }
  catch(err){
    throw new Error(err)
  }

}

// forget passwords function 
export const forgotPasswordService = async (email:string) => {
  

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("user not found")
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_RESET_SECRET!, { expiresIn: '15m' });

  const resetLink = `http://localhost:4000/user/reset-password?token=${token}`;

  // send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset your password',
    html: `<p>Click here to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
  });
return true;
}

//reset password function 
export const resetPasswordService=async(token:string,newPassword:string)=>{

  if(!token || !newPassword){
    throw new Error("token or the password is missing")
  }
  try{
    const decoded = jwt.verify(token,process.env.JWT_RESET_SECRET!) as {userId:number}
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });
    return true;
  }  catch(err){
     return (err)
  }
}