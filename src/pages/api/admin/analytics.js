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
    
    // Get user preferences for interest analysis
    const userPreferences = await prisma.userPreferences.findMany();

    // Get user analytics data
    const userAnalytics = await prisma.userAnalytics.findMany();

    // Initialize variables for article data
    let articleClicks = [];
    let topArticles = [];
    let userArticleClicks = {};
    let totalArticleClicks = userAnalytics.reduce((sum, user) => sum + (user.articleClicks || 0), 0);
    
    // Try to get article clicks data if the model exists
    try {
      // Check if the model exists by trying to access it
      articleClicks = await prisma.articleClick.findMany({
        orderBy: {
          clickedAt: 'desc'
        }
      });
      
      // If we get here, the model exists and we have data
      
      // Group article clicks by user
      articleClicks.forEach(click => {
        if (!userArticleClicks[click.userId]) {
          userArticleClicks[click.userId] = [];
        }
        userArticleClicks[click.userId].push(click);
      });
      
      // For each user, sort clicks by date and limit to most recent 10
      Object.keys(userArticleClicks).forEach(userId => {
        userArticleClicks[userId] = userArticleClicks[userId]
          .sort((a, b) => new Date(b.clickedAt) - new Date(a.clickedAt))
          .slice(0, 10);
      });
      
      // Calculate most clicked articles
      const articleClickMap = {};
      articleClicks.forEach(click => {
        const key = `${click.title}|${click.url}`;
        if (!articleClickMap[key]) {
          articleClickMap[key] = {
            title: click.title,
            url: click.url,
            category: click.category,
            clickCount: 0,
            lastClicked: null
          };
        }
        articleClickMap[key].clickCount++;
        
        // Update last clicked time if this is more recent
        const clickTime = new Date(click.clickedAt).getTime();
        if (!articleClickMap[key].lastClicked || clickTime > new Date(articleClickMap[key].lastClicked).getTime()) {
          articleClickMap[key].lastClicked = click.clickedAt;
        }
      });
      
      // Convert to array and sort by click count
      topArticles = Object.values(articleClickMap)
        .sort((a, b) => b.clickCount - a.clickCount)
        .slice(0, 10); // Get top 10 articles
    } catch (error) {
      console.log('ArticleClick model may not exist yet:', error.message);
      // Continue without article click data
    }

    // Calculate interest popularity
    const interestPopularity = {};
    userPreferences.forEach(pref => {
      if (pref.interests) {
        pref.interests.forEach(interest => {
          if (!interestPopularity[interest]) {
            interestPopularity[interest] = 0;
          }
          interestPopularity[interest]++;
        });
      }
    });

    // Sort interests by popularity
    const sortedInterests = Object.entries(interestPopularity)
      .sort((a, b) => b[1] - a[1])
      .map(([interest, count]) => ({ 
        interest, 
        count,
        percentage: Math.round((count / userPreferences.length) * 100)
      }));

    // Calculate interest to reading correlation
    const interestCorrelations = [];
    const allInterests = [...new Set(userPreferences.flatMap(pref => pref.interests || []))];

    // For each interest, calculate correlation metrics
    for (const interest of allInterests) {
      // Get users with this interest
      const usersWithInterest = userPreferences
        .filter(pref => pref.interests && pref.interests.includes(interest))
        .map(pref => pref.userId);
      
      // Get analytics for these users
      const relevantAnalytics = userAnalytics.filter(a => usersWithInterest.includes(a.userId));
      
      // Calculate average articles read
      const totalArticlesRead = relevantAnalytics.reduce((sum, a) => sum + (a.articleClicks || 0), 0);
      const avgArticlesRead = usersWithInterest.length > 0 ? totalArticlesRead / usersWithInterest.length : 0;
      
      // Find top related category
      const categoryCount = {};
      relevantAnalytics.forEach(a => {
        const views = a.categoryViews || {};
        Object.entries(views).forEach(([category, count]) => {
          if (!categoryCount[category]) {
            categoryCount[category] = 0;
          }
          categoryCount[category] += count;
        });
      });
      
      const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
      
      interestCorrelations.push({
        interest,
        userCount: usersWithInterest.length,
        avgArticlesRead,
        topCategory
      });
    }

    // Sort by user count
    interestCorrelations.sort((a, b) => b.userCount - a.userCount);

    // Get all users to match with analytics
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        preferences: true
      }
    });

    // Combine user data with analytics data
    const userAnalyticsWithUserInfo = userAnalytics.map(analytic => {
      const user = users.find(u => u.id === analytic.userId);
      return {
        ...analytic,
        user: user || null
      };
    });

    // Calculate popular categories from user analytics
    const categoryViews = {};
    userAnalytics.forEach(analytic => {
      if (analytic.categoryViews) {
        Object.entries(analytic.categoryViews).forEach(([category, count]) => {
          if (!categoryViews[category]) {
            categoryViews[category] = 0;
          }
          categoryViews[category] += count;
        });
      }
    });

    // Sort categories by popularity
    const sortedCategories = Object.entries(categoryViews)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ 
        category, 
        count,
        percentage: Math.round((count / Object.values(categoryViews).reduce((a, b) => a + b, 0)) * 100)
      }));

    // Return analytics data
    return res.status(200).json({
      userCount,
      totalArticleClicks,
      topArticles,
      popularCategories: sortedCategories,
      userAnalytics: userAnalyticsWithUserInfo,
      interestPopularity: sortedInterests,
      interestCorrelations,
      userArticleClicks
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}
