import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt?: string;
  source?: {
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  preferences?: {
    interests: string[];
    newsCategory: string[];
  };
}

export default function Home() {
  const router = useRouter();
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  
  // State for news articles
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // User preferences state
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'category' | 'personalized' | 'random'>('personalized');
  
  // Available interests for personalization
  const interests = ['technology', 'science', 'business', 'entertainment', 'health', 'sports', 'politics'];

  // Check authentication status on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        
        if (!response.ok) {
          console.error('Session API returned error:', response.status);
          // Load default preferences from localStorage instead of redirecting
          loadDefaultPreferences();
          return;
        }
        
        const data = await response.json();
        
        if (data.user) {
          // User is authenticated
          setIsLoggedIn(true);
          setUser(data.user);
          
          // Load preferences from user data
          if (data.user.preferences?.interests?.length > 0) {
            setUserPreferences(data.user.preferences.interests);
          } else {
            // Default preferences if none saved
            const defaultPreferences = ['technology', 'science'];
            setUserPreferences(defaultPreferences);
          }
        } else {
          // No authenticated user, but don't redirect immediately
          // Just load default preferences from localStorage
          loadDefaultPreferences();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Load default preferences from localStorage instead of redirecting
        loadDefaultPreferences();
      } finally {
        // Always set loading to false after authentication check
        setIsLoading(false);
      }
    };
    
    const loadDefaultPreferences = () => {
      // Load preferences from localStorage if not logged in
      const savedPreferences = localStorage.getItem('newsPreferences');
      if (savedPreferences) {
        setUserPreferences(JSON.parse(savedPreferences));
      } else {
        // Default preferences if none saved
        const defaultPreferences = ['technology', 'science'];
        setUserPreferences(defaultPreferences);
        localStorage.setItem('newsPreferences', JSON.stringify(defaultPreferences));
      }
    };
    
    checkAuth();
  }, [router]);

  // Save preferences when they change
  useEffect(() => {
    if (userPreferences.length > 0) {
      if (isLoggedIn && user) {
        // Save preferences to database if logged in
        fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            preferences: userPreferences,
            categories: userPreferences
          })
        }).catch(error => console.error('Error saving preferences:', error));
      } else {
        // Save to localStorage if not logged in
        localStorage.setItem('newsPreferences', JSON.stringify(userPreferences));
      }
    }
  }, [userPreferences, isLoggedIn, user]);

  // Fetch news based on current view mode and selection
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        let endpoint = '/api/news';
        let queryParams = '';

        if (viewMode === 'category' && selectedCategory) {
          // Fetch news for specific category
          queryParams = `?preferences=${selectedCategory}`;
        } else if (viewMode === 'personalized') {
          // Fetch personalized news based on user preferences
          queryParams = `?preferences=${userPreferences.join(',')}`;
        } else if (viewMode === 'random') {
          // Fetch random news from all categories
          queryParams = '?random=true';
        }

        const response = await fetch(`${endpoint}${queryParams}`);
        const data = await response.json();
        setNews(data);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have preferences
    if (userPreferences.length > 0) {
      fetchNews();
    }
  }, [viewMode, selectedCategory, userPreferences]);

  // Toggle category in user preferences
  const togglePreference = (category: string) => {
    if (userPreferences.includes(category)) {
      setUserPreferences(userPreferences.filter(pref => pref !== category));
    } else {
      setUserPreferences([...userPreferences, category]);
    }
  };

  // Handle category selection
  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setViewMode('category');
  };

  // Switch to personalized view
  const showPersonalized = () => {
    setViewMode('personalized');
    setSelectedCategory('');
  };

  // Switch to random news view
  const showRandom = () => {
    setViewMode('random');
    setSelectedCategory('');
  };

  // Handle login
  const handleLogin = () => {
    router.push('/login');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <div className="header flex justify-between items-center border-b pb-4 mb-6">
        <div className="flex items-center">
          <svg className="w-8 h-8 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
            <path d="M18 14h-8"></path>
            <path d="M15 18h-5"></path>
            <path d="M10 6h8v4h-8V6Z"></path>
          </svg>
          <h1 className="text-2xl font-bold text-gray-800">Microsoft News</h1>
        </div>
        
        <div className="user-section flex items-center">
          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              <span className="welcome-message hidden sm:inline-block text-gray-600">Welcome, {user?.name || 'User'}</span>
              {user?.role === 'admin' && (
                <button 
                  className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors flex items-center text-sm"
                  onClick={() => router.push('/admin/dashboard')}
                >
                  <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  Admin
                </button>
              )}
              <button 
                className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors text-sm"
                onClick={handleLogout}
              >
                <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <button 
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm transition-colors"
              onClick={handleLogin}
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Sign In
            </button>
          )}
        </div>
      </div>
      
      {/* View mode selection */}
      <div className="viewModeSection mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">View Mode</h2>
        <div className="categoryButtons flex flex-wrap gap-2">
          <button 
            className={`px-4 py-2 rounded-full text-sm ${viewMode === 'personalized' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            onClick={showPersonalized}
          >
            <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            My News
          </button>
          <button 
            className={`px-4 py-2 rounded-full text-sm ${viewMode === 'random' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            onClick={showRandom}
          >
            <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            Random
          </button>
          {selectedCategory && (
            <button 
              className={`px-4 py-2 rounded-full text-sm ${viewMode === 'category' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
              </svg>
              {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </button>
          )}
        </div>
      </div>
      

      
      {/* User preferences */}
      <div className="preferencesSection mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">My Interests</h2>
        <p className="preferencesNote text-sm text-gray-600 mb-3">Select topics you're interested in to personalize your feed:</p>
        <div className="categoryButtons flex flex-wrap gap-2">
          {interests.map((interest) => (
            <button 
              key={`pref-${interest}`}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                userPreferences.includes(interest) 
                  ? 'bg-blue-50 border-blue-400 text-blue-700 font-medium' 
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => togglePreference(interest)}
            >
              {userPreferences.includes(interest) && (
                <svg className="w-3 h-3 inline-block mr-1 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
              {interest.charAt(0).toUpperCase() + interest.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* News display */}
      <div className="newsHeader mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          {viewMode === 'personalized' && (
            <>
              <svg className="w-5 h-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Personalized For You
            </>
          )}
          {viewMode === 'random' && (
            <>
              <svg className="w-5 h-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Random News
            </>
          )}
          {viewMode === 'category' && (
            <>
              <svg className="w-5 h-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
              </svg>
              {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} News
            </>
          )}
        </h2>
      </div>
      
      {isLoading ? (
        <div className="loadingState flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading news...</span>
        </div>
      ) : (
        <div className="newsContainer grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.length > 0 ? (
            news.map((article, index) => (
              <div key={index} className="newsArticle flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                {article.urlToImage ? (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={article.urlToImage} 
                      alt={article.title} 
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                      <circle cx="12" cy="10" r="3"></circle>
                      <path d="M16.5 17.5c-1.5-2-8.5-2-10 0"></path>
                    </svg>
                  </div>
                )}
                <div className="articleContent flex-1 p-4">
                  {article.source?.name && (
                    <div className="articleSource text-xs font-semibold text-blue-600 mb-2">
                      {article.source.name}
                      {article.publishedAt && (
                        <span className="text-gray-500 ml-2">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.description}</p>
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="articleLink inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Read more
                    <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="noNewsMessage col-span-full py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p className="text-gray-600">No articles found. Try selecting different categories.</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                onClick={showRandom}
              >
                Show random news instead
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}