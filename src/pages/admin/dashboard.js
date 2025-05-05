// pages/admin/dashboard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuthUser } from '../../lib/auth';

// Server-side authentication check
export async function getServerSideProps({ req, res }) {
  try {
    // Get the authenticated user
    const user = getAuthUser(req);
    
    // Debug log
    console.log('Dashboard getServerSideProps - Auth user:', user);
    
    // Check if user exists and is admin
    if (!user) {
      console.log('No user found, redirecting to login');
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }
    
    if (user.role !== 'admin') {
      console.log('User is not admin, redirecting to home');
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
    
    // Return user data as props
    return {
      props: { user }
    };
  } catch (error) {
    console.error('Dashboard getServerSideProps error:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}

export default function Dashboard({ user }) {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  // Check for dark mode on component mount
  useEffect(() => {
    // Check if user prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    
    // Listen for changes in color scheme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Fetch analytics data
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/analytics', {
          credentials: 'include',
        });
        
        if (response.status === 403) {
          console.log('Analytics API returned 403, redirecting to login');
          window.location.href = '/login';
          return;
        }
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate total article clicks across all users
  const totalArticleClicks = analytics?.userAnalytics?.reduce(
    (sum, user) => sum + (user.articleClicks || 0), 
    0
  ) || 0;

  // Calculate average session count per user
  const averageSessionCount = analytics?.userAnalytics?.length 
    ? (analytics.userAnalytics.reduce(
        (sum, user) => sum + (user.sessionCount || 0), 
        0
      ) / analytics.userAnalytics.length).toFixed(1)
    : 0;

  // Get most active users (by session count)
  const mostActiveUsers = analytics?.userAnalytics
    ? [...analytics.userAnalytics]
        .sort((a, b) => (b.sessionCount || 0) - (a.sessionCount || 0))
        .slice(0, 5)
    : [];

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-8 rounded-lg shadow-md max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center text-red-500 mb-4">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold">Error</h2>
          </div>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main dashboard content with enhanced UI
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 shadow-md' : 'bg-white shadow-sm'}`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
              </div>
              <span className={`ml-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{user.name || user.email}</span>
            </div>
            <button 
              onClick={() => router.push('/')}
              className={`px-4 py-2 rounded-md flex items-center transition-colors duration-200 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className={`flex border-b mb-6 ${isDarkMode ? 'border-gray-700' : ''}`}>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'overview' 
              ? isDarkMode 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-blue-600 border-b-2 border-blue-600' 
              : isDarkMode 
                ? 'text-gray-400 hover:text-blue-400' 
                : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'users' 
              ? isDarkMode 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-blue-600 border-b-2 border-blue-600' 
              : isDarkMode 
                ? 'text-gray-400 hover:text-blue-400' 
                : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'categories' 
              ? isDarkMode 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-blue-600 border-b-2 border-blue-600' 
              : isDarkMode 
                ? 'text-gray-400 hover:text-blue-400' 
                : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-lg shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>{analytics?.userCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Repeat the same pattern for other stat cards */}
          {/* Add isDarkMode conditional classes to all other UI elements */}
        </div>

        {/* The rest of your dashboard content with dark mode classes added */}
        {/* ... */}
      </main>

      {/* Footer */}
      <footer className={`border-t mt-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="container mx-auto px-4 py-4">
          <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} Personalized News Admin Dashboard
          </p>
        </div>
      </footer>
    </div>
  );
}