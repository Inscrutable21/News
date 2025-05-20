// Create or update the admin auth endpoint
import { getAuthUser } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Get authenticated user from JWT token
    const user = getAuthUser(req);
    
    // Debug log
    console.log('Admin auth check for user:', user);
    
    if (!user) {
      console.log('No authenticated user found');
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (user.role !== 'admin') {
      console.log('User is not an admin:', user.role);
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // User is authenticated and is an admin
    console.log('Admin authentication successful');
    return res.status(200).json({ 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
}