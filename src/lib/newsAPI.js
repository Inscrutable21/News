const NewsAPI = require('newsapi');

// Initialize the NewsAPI client with your API key from the environment variables
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

// Function to fetch news based on user preferences (categories)
exports.fetchPersonalizedNews = async function (categories) {
  let allArticles = [];

  // Fetch news for each specified category
  for (const category of categories) {
    try {
      const response = await newsapi.v2.topHeadlines({
        category: category,
        language: 'en', // You can adjust the language as needed
        pageSize: 5,   // Number of articles to fetch per category
      });

      // Add the fetched articles to the overall array
      allArticles = [...allArticles, ...response.articles];
    } catch (error) {
      console.error(`Error fetching news for category ${category}:`, error);
    }
  }

  return allArticles;
};

// Function to fetch general news (when no specific preferences are provided)
exports.fetchGeneralNews = async function () {
  try {
    const response = await newsapi.v2.topHeadlines({
      country: 'us', // Default country - you can adjust this
      language: 'en', // Default language
      pageSize: 10, // Number of general news articles to fetch
    });

    return response.articles;
  } catch (error) {
    console.error('Error fetching general news:', error);
    return []; // Return an empty array if there's an error
  }
};

// Function to fetch random news but with a bias toward user preferences
exports.fetchRandomNews = async function (userPreferences = []) {
  try {
    // Get all available categories
    const allCategories = ['technology', 'science', 'business', 'entertainment', 'health', 'sports', 'politics', 'general'];
    
    // Prepare array to hold all fetched articles
    let allArticles = [];
    
    // If user has preferences, prioritize them but still include other categories
    let priorityCategories = [...userPreferences];
    let otherCategories = allCategories.filter(cat => !userPreferences.includes(cat));
    
    // Shuffle the other categories for randomness
    otherCategories = otherCategories.sort(() => Math.random() - 0.5);
    
    // Combine with preference categories first, then others
    const orderedCategories = [...priorityCategories, ...otherCategories];
    
    // Limit to a max of 4 categories to avoid too many API calls
    const selectedCategories = orderedCategories.slice(0, 4);
    
    // Get more articles from preferred categories (if any)
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
    return []; // Return empty array on error
  }
};