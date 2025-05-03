// pages/api/auth/logout.js
import nextSession from 'next-session';
import { clearAuthCookie } from '../../../lib/auth';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Clear the user from session
    if (req.session) {
      req.session.user = null;
    }
    
    // Also clear the auth cookie
    clearAuthCookie(res);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}