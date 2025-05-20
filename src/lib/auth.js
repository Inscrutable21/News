// lib/auth.js
import { sign, verify } from 'jsonwebtoken';
import * as cookie from 'cookie';

// Use a strong secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-jwt-secret-at-least-32-chars';

export function setAuthCookie(res, user) {
  // Create a JWT token with user data
  const token = sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || '' 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  // Set cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in milliseconds
    path: '/',
    sameSite: 'lax',
  };
  
  // Set the cookie
  res.setHeader('Set-Cookie', cookie.serialize('auth-token', token, cookieOptions));
  
  console.log('Auth cookie set for user:', user.email, 'with role:', user.role);
}

export function getAuthUser(req) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies['auth-token'];
    
    if (!token) {
      console.log('No auth token found in cookies');
      return null;
    }
    
    // Verify and decode the token
    const user = verify(token, JWT_SECRET);
    console.log('User from auth token:', user);
    return user;
  } catch (error) {
    console.error('Auth token validation error:', error.message);
    return null;
  }
}

export function clearAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
      sameSite: 'lax',
    })
  );
}
