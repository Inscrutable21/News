// pages/api/auth/login.js
import { prisma } from '../../../lib/prisma';
import { compare } from 'bcryptjs';
import { setAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set auth cookie
    setAuthCookie(res, user);

    // In the existing login.js file, update the successful login section:
    
    // After line 30 (after setAuthCookie(res, user);)
    // Add this code to also set the session:
    if (req.session) {
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
      await req.session.commit();
    }
    
    // Log for debugging
    console.log('Login successful - Session and JWT set:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}
