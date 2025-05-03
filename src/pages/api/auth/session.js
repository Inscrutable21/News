import nextSession from 'next-session';
import { getAuthUser } from '../../../lib/auth';

// Initialize session handler with consistent configuration
const getSession = nextSession({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    sameSite: 'lax',
  },
  autoCommit: true,
  name: 'news-session',
});

export default async function handler(req, res) {
  // Apply session middleware
  await getSession(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // First check JWT token (more reliable)
    const authUser = getAuthUser(req);
    
    if (authUser) {
      console.log('User found in JWT token:', authUser);
      return res.status(200).json({ user: authUser });
    }
    
    // Fallback to session check
    if (req.session && req.session.user) {
      console.log('User found in session:', req.session.user);
      return res.status(200).json({ user: req.session.user });
    }
    
    // No authenticated user found
    console.log('No authenticated user found');
    return res.status(200).json({ user: null });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}