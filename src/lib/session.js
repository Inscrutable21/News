// lib/session.js
import nextSession from "next-session";

export const getSession = nextSession({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    sameSite: 'lax', // Changed from strict to lax for better compatibility
  },
  autoCommit: true,
  name: 'news-session',
});

// Helper to get session in getServerSideProps
export async function getServerSideSession(req, res) {
  await getSession(req, res);
  return req.session;
}
