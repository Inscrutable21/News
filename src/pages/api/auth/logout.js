import nextSession from 'next-session';

// Initialize session handler
const getSession = nextSession();

export default async function handler(req, res) {
  // Apply session middleware
  await getSession(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Clear the user from session
    if (req.session) {
      req.session.user = null;
      
      // Save session if the method exists
      if (req.session.save) {
        await req.session.save();
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}