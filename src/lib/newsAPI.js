const NewsAPI = require('newsapi');


const newsapi = new NewsAPI(process.env.NEWS_API_KEY);


exports.fetchPersonalizedNews = async function (categories) {
  let allArticles = [];


  for (const category of categories) {
    try {
      const response = await newsapi.v2.topHeadlines({
        category: category,
        language: 'en', 
        pageSize: 5,  
      });

   
      allArticles = [...allArticles, ...response.articles];
    } catch (error) {
      console.error(`Error fetching news for category ${category}:`, error);
    }
  }

  return allArticles;
};


exports.fetchGeneralNews = async function () {
  try {
    const response = await newsapi.v2.topHeadlines({
      country: 'us', 
      language: 'en',
      pageSize: 10, 
    });

    return response.articles;
  } catch (error) {
    console.error('Error fetching general news:', error);
    return []; 
  }
};


exports.fetchRandomNews = async function (userPreferences = []) {
  try {
    
    const allCategories = ['technology', 'science', 'business', 'entertainment', 'health', 'sports', 'politics', 'general'];
    
   
    let allArticles = [];
    
    
    let priorityCategories = [...userPreferences];
    let otherCategories = allCategories.filter(cat => !userPreferences.includes(cat));
    
    
    otherCategories = otherCategories.sort(() => Math.random() - 0.5);
    
   
    const orderedCategories = [...priorityCategories, ...otherCategories];
    
   
    const selectedCategories = orderedCategories.slice(0, 4);
    
  
    for (const category of selectedCategories) {
      try {
        // Get more articles from preferred categories
        const pageSize = userPreferences.includes(category) ? 6 : 3;
        
        const response = await newsapi.v2.topHeadlines({
          category: category,
          language: 'en',
          pageSize: pageSize,
        });
        
        allArticles = [...allArticles, ...response.articles];
      } catch (error) {
        console.error(`Error fetching random news for category ${category}:`, error);
      }
    }
    
    // Shuffle the articles for a random feel but with preference bias
    return allArticles.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Error fetching random news:', error);
    return []; 
  }
};