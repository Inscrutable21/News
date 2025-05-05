import { PrismaClient } from '@prisma/client';
import { fetchPersonalizedNews } from '../../lib/newsAPI';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Get user analytics
    const analytics = await prisma.userAnalytics.findFirst({
      where: { userId }
    });

    // If no analytics found, use default categories
    if (!analytics) {
      const defaultCategories = ['technology', 'general', 'business', 'entertainment', 'health', 'sports'];
      
      const newsPromises = defaultCategories.map(async category => {
        const articles = await fetchPersonalizedNews([category]);
        return articles.slice(0, 3).map(article => ({
          ...article,
          category,
          recommendationReason: 'Popular topics we think you might enjoy'
        }));
      });
      
      try {
        const newsResults = await Promise.all(newsPromises);
        let allNews = newsResults.flat();
        allNews = allNews.sort(() => 0.5 - Math.random());
        
        return res.status(200).json({
          recommendedCategories: defaultCategories,
          articles: allNews.slice(0, 12), // Return at least 12 articles
          recommendationInsights: {
            method: 'default',
            reason: 'Since this is your first visit, we\'re showing popular topics across various categories.'
          }
        });
      } catch (error) {
        console.error('Error fetching default news:', error);
        return res.status(500).json({ message: 'Failed to fetch default news' });
      }
    }

    // Get user preferences
    const userPrefs = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    // Extract most viewed categories from analytics
    const categoryViews = analytics.categoryViews || {};
    const sortedCategories = Object.entries(categoryViews)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Combine explicit preferences with implicit behavior
    let recommendedCategories = [];
    
    // First add top categories from viewing behavior (implicit)
    if (sortedCategories.length > 0) {
      recommendedCategories = recommendedCategories.concat(sortedCategories.slice(0, 3));
    }
    
    // Then add explicit preferences if they exist
    if (userPrefs?.interests?.length > 0) {
      userPrefs.interests.forEach(interest => {
        if (!recommendedCategories.includes(interest)) {
          recommendedCategories.push(interest);
        }
      });
    }
    
    // Ensure we have at least 6 categories for more variety
    const allCategories = ['technology', 'general', 'business', 'entertainment', 'health', 'sports', 'science'];
    
    // Add additional categories if needed
    if (recommendedCategories.length < 6) {
      allCategories.forEach(category => {
        if (!recommendedCategories.includes(category) && recommendedCategories.length < 6) {
          recommendedCategories.push(category);
        }
      });
    }
    
    // Generate reasons for recommendations based on user data
    const recommendationReasons = {};
    
    // Add reasons for categories from viewing history
    sortedCategories.slice(0, 3).forEach(category => {
      recommendationReasons[category] = `Based on your ${category} reading history`;
    });
    
    // Add reasons for explicit preferences
    if (userPrefs?.interests?.length > 0) {
      userPrefs.interests.forEach(interest => {
        if (!recommendationReasons[interest]) {
          recommendationReasons[interest] = `Matches your selected interests`;
        }
      });
    }
    
    // Default reason for other categories
    allCategories.forEach(category => {
      if (!recommendationReasons[category] && recommendedCategories.includes(category)) {
        recommendationReasons[category] = `Popular topics we think you might enjoy`;
      }
    });

    // Fetch news for recommended categories
    const newsPromises = recommendedCategories.map(async category => {
      const articles = await fetchPersonalizedNews([category]);
      return articles.slice(0, 3).map(article => ({
        ...article,
        category,
        recommendationReason: recommendationReasons[category]
      }));
    });
    
    const newsResults = await Promise.all(newsPromises);
    
    // Flatten and shuffle the results for variety
    let allNews = newsResults.flat();
    allNews = allNews.sort(() => 0.5 - Math.random());
    
    // Create insights about the recommendation
    const insightsData = {
      topCategories: sortedCategories.slice(0, 3),
      explicitPreferences: userPrefs?.interests || [],
      articleCount: allNews.length,
      categoriesUsed: recommendedCategories,
      method: sortedCategories.length > 0 ? 'personalized' : 'preference-based',
      reason: sortedCategories.length > 0 
        ? 'Your recommendations are based on your reading history and preferences' 
        : 'Your recommendations are based on your selected interests'
    };
    
    // Return personalized news with at least 12 articles
    res.status(200).json({
      recommendedCategories,
      articles: allNews.slice(0, Math.max(12, allNews.length)), // Ensure at least 12 articles
      recommendationInsights: insightsData
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
}