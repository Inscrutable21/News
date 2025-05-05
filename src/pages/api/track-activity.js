import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, activityType, category, articleId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Get existing analytics or create new record
    let userAnalytics = await prisma.userAnalytics.findFirst({
      where: { userId }
    });

    if (!userAnalytics) {
      // Initialize new user analytics
      userAnalytics = await prisma.userAnalytics.create({
        data: {
          userId,
          categoryViews: {},
          articleClicks: 0,
          sessionCount: 1,
          lastActive: new Date()
        }
      });
    } else {
      // Update last active timestamp
      await prisma.userAnalytics.update({
        where: { id: userAnalytics.id },
        data: { lastActive: new Date() }
      });
    }

    // Track specific activity
    if (activityType === 'view' && category) {
      // Update category views
      const categoryViews = userAnalytics.categoryViews || {};
      categoryViews[category] = (categoryViews[category] || 0) + 1;
      
      await prisma.userAnalytics.update({
        where: { id: userAnalytics.id },
        data: { categoryViews }
      });
    } 
    else if (activityType === 'click') {
      // Increment article clicks
      await prisma.userAnalytics.update({
        where: { id: userAnalytics.id },
        data: { 
          articleClicks: { increment: 1 }
        }
      });
    }
    else if (activityType === 'session') {
      // Increment session count
      await prisma.userAnalytics.update({
        where: { id: userAnalytics.id },
        data: { 
          sessionCount: { increment: 1 }
        }
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking user activity:', error);
    res.status(500).json({ message: 'Failed to track activity' });
  }
}