const { fetchPersonalizedNews, fetchGeneralNews, fetchRandomNews } = require('../../lib/newsAPI');

export default async function handler(req, res) {
  try {
    const { preferences, random } = req.query;

    let articles;

    if (random === 'true') {
      // Fetch random news with a bias toward user preferences if available
      const userPrefs = preferences ? preferences.split(',') : [];
      articles = await fetchRandomNews(userPrefs);
    } else if (preferences && preferences.length > 0) {
      // Fetch personalized news based on specific preferences
      articles = await fetchPersonalizedNews(preferences.split(','));
    } else {
      // Fetch general news
      articles = await fetchGeneralNews();
    }

    res.status(200).json(articles);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}