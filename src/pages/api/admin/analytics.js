// pages/api/admin/analytics.js
import { prisma } from '../../../lib/prisma';
import { getAuthUser } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Get authenticated user directly from cookie
    const user = getAuthUser(req);
    
    // Log for debugging
    console.log('Analytics API - Auth user:', user ? {
      id: user.id,
      role: user.role
    } : 'No authenticated user');
    
    // Check if user exists and is admin
    if (!user || user.role !== 'admin') {
      console.log('User is not authorized for analytics');
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get basic analytics
    const userCount = await prisma.user.count();
    
    // Get user preferences
    const userPreferences = await prisma.userPreferences.findMany();
    
    // Calculate category popularity
    const categoryPopularity = {};
    userPreferences.forEach(pref => {
      if (pref.interests) {
        pref.interests.forEach(interest => {
          if (!categoryPopularity[interest]) {
            categoryPopularity[interest] = 0;
          }
          categoryPopularity[interest]++;
        });
      }
    });
    
    // Sort categories by popularity
    const sortedCategories = Object.entries(categoryPopularity)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));
    
    // Return analytics data
    return res.status(200).json({
      userCount,
      popularCategories: sortedCategories,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}
