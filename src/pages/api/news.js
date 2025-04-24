// pages/api/news.js
import { prisma, disconnect } from '../../lib/prisma';
import { getNewsByCategory } from '../../lib/newsAPI';
import { validateUserId } from '../../utils/validateUser';

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId || !validateUserId(userId)) {
    return res.status(400).json({ message: "Invalid or missing user ID" });
  }

  try {
    // Fetch user preferences from the database using the unique userId
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },  // Now that userId is unique, we can use it here
    });

    if (!userPreferences) {
      return res.status(404).json({ message: "User preferences not found" });
    }

    // Fetch news for each of the user's interests
    const newsPromises = userPreferences.interests.map((interest) =>
      getNewsByCategory(interest)
    );
    const newsResults = await Promise.all(newsPromises);
    const allNews = newsResults.flat();

    res.status(200).json(allNews);
  } catch (error) {
    console.error("Error fetching news: ", error); // Use console.error for simple error logging
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await disconnect(); // Disconnect Prisma client to release resources
  }
}
