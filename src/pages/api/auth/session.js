import nextSession from 'next-session';

// Initialize session handler with the same configuration as login.js
const getSession = nextSession({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  },
});

export default async function handler(req, res) {
  // Apply session middleware
  await getSession(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if user is in session
    if (req.session && req.session.user) {
      return res.status(200).json({ user: req.session.user });
    } else {
      // No authenticated user
      return res.status(200).json({ user: null });
    }
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}