// pages/api/admin/users.js
import { prisma } from '../../../lib/prisma';
import { getAuthUser } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Get authenticated user
    const user = getAuthUser(req);
    
    // Check if user exists and is admin
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get all users with their analytics
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        preferences: true
      }
    });

    // Get all analytics
    const analytics = await prisma.userAnalytics.findMany();

    // Combine users with their analytics
    const usersWithAnalytics = users.map(user => {
      const userAnalytics = analytics.find(a => a.userId === user.id) || null;
      return {
        ...user,
        analytics: userAnalytics
      };
    });

    return res.status(200).json({ 
      users: usersWithAnalytics
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}