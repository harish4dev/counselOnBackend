import bcrypt from 'bcrypt';
import prisma from '../config/db';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer'

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