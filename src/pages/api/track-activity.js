import { prisma } from '../../lib/prisma';
import { getAuthUser } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, activityType, category, articleTitle, articleUrl } = req.body;
    
    // Verify the user is authenticated
    const authUser = getAuthUser(req);
    if (!authUser || authUser.id !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get or create user analytics record
    let userAnalytics = await prisma.userAnalytics.findUnique({
      where: { userId }
    });

    if (!userAnalytics) {
      userAnalytics = await prisma.userAnalytics.create({
        data: {
          userId,
          lastActive: new Date(),
          sessionCount: 0,
          articleClicks: 0,
          categoryViews: {}
        }
      });
    }

    // Update analytics based on activity type
    const updates = {
      lastActive: new Date()
    };

    if (activityType === 'session') {
      updates.sessionCount = (userAnalytics.sessionCount || 0) + 1;
    } else if (activityType === 'click') {
      updates.articleClicks = (userAnalytics.articleClicks || 0) + 1;
      
      // Update category views
      const categoryViews = userAnalytics.categoryViews || {};
      categoryViews[category] = (categoryViews[category] || 0) + 1;
      updates.categoryViews = categoryViews;
      
      // Log the article click for detailed analytics
      await prisma.articleClick.create({
        data: {
          userId,
          category,
          title: articleTitle || 'Unknown',
          url: articleUrl || '',
          clickedAt: new Date()
        }
      });
    } else if (activityType === 'view') {
      // Update category views
      const categoryViews = userAnalytics.categoryViews || {};
      categoryViews[category] = (categoryViews[category] || 0) + 1;
      updates.categoryViews = categoryViews;
    }

    // Update the user analytics
    await prisma.userAnalytics.update({
      where: { userId },
      data: updates
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking activity:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}
