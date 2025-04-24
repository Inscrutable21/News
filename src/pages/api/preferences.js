// pages/api/preferences.js
import { prisma, disconnect } from '../../lib/prisma';
import logger from '../../lib/logger';
import { validateUserId, validateInterests } from '../../utils/validateUser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { userId, interests } = req.body;

  if (!userId || !validateUserId(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (!interests || !validateInterests(interests)) {
    return res.status(400).json({ message: "Invalid interests" });
  }

  try {
    // Upsert user preferences (create or update)
    const userPreferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: { interests },
      create: { userId, interests },
    });

    res.status(200).json(userPreferences);
  } catch (error) {
    logger.error("Error updating preferences: ", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await disconnect();
  }
}
