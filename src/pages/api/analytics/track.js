import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, action, details, timestamp } = req.body;

    // Basic validation
    if (!userId || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Record the interaction
    const interaction = await prisma.userAnalytics.upsert({
      where: { userId },
      update: {
        lastActive: new Date(timestamp),
        sessionCount: { increment: 1 },
        // Update category views if this is a category selection
        ...(action === 'select_category' && {
          categoryViews: prisma.raw(`jsonb_set("categoryViews", '{${details.category}}', 
            (COALESCE(("categoryViews"->>'${details.category}')::int, 0) + 1)::text::jsonb)`)
        }),
        // Increment article clicks if this is an article click
        ...(action === 'article_click' && {
          articleClicks: { increment: 1 }
        })
      },
      create: {
        userId,
        lastActive: new Date(timestamp),
        sessionCount: 1,
        categoryViews: action === 'select_category' ? { [details.category]: 1 } : {},
        articleClicks: action === 'article_click' ? 1 : 0
      }
    });

    // Also record detailed interaction for heatmap analysis
    await prisma.userInteraction.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details),
        timestamp: new Date(timestamp)
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking user interaction:', error);
    res.status(500).json({ message: 'Failed to track interaction' });
  }
}