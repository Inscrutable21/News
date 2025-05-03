import { prisma } from '../../../lib/prisma';
import { hash } from 'bcryptjs';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Add a secret key check for security
  const { secretKey } = req.body;
  
  if (secretKey !== process.env.ADMIN_SEED_KEY && secretKey !== 'admin-setup-secure-key') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      return res.status(200).json({ 
        message: 'Admin user already exists', 
        email: existingAdmin.email 
      });
    }

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    // Validate environment variables
    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ 
        message: 'Admin credentials not configured in environment variables' 
      });
    }
    
    // Hash the password
    const hashedPassword = await hash(adminPassword, 10);

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        preferences: {
          create: {
            interests: ['technology', 'business', 'politics'],
            newsCategory: ['technology', 'business', 'politics'],
          },
        },
      },
    });

    // Don't send password in response
    const { password: _, ...adminWithoutPassword } = admin;

    return res.status(201).json({
      message: 'Admin user created successfully',
      admin: adminWithoutPassword
    });
  } catch (error) {
    console.error('Admin seed error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}