// lib/newsAPI.js
import axios from 'axios';

const API_KEY = process.env.NEWS_API_KEY;

export const getNewsByCategory = async (category) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        category,
        apiKey: API_KEY,
        pageSize: 5,  // Limit results to avoid overload
      },
    });

    return response.data.articles || [];
  } catch (error) {
    throw new Error(`Failed to fetch news for category: ${category}`);
  }
};
