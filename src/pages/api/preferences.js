const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { userId, preferences, categories } = req.body;

  try {
    // Create or update user preferences
    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        interests: preferences,
        newsCategory: categories,
      },
      create: {
        userId,
        interests: preferences,
        newsCategory: categories,
      },
    });

    res.status(200).json(updatedPreferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
}