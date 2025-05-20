import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Update the NewsArticle interface to include the recommendation reason
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt?: string;
  source?: {
    name: string;
  };
  category?: string; // Added for tracking
  recommendationReason?: string; // Add this line for recommendation reasons
}

// Add this interface for recommendation insights
interface RecommendationInsights {
  topCategories?: string[];
  explicitPreferences?: string[];
  articleCount?: number;
  categoriesUsed?: string[];
  method?: string;
  reason?: string;
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
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  
  // State for news articles
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // User preferences state
  const [userPreferences, setUserPreferences] = useState<string[]>(['technology', 'business']);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Add this line with your other state variables (around line 45)
  // Add these new state variables for 'For You' section
  const [forYouNews, setForYouNews] = useState<NewsArticle[]>([]);
  const [isLoadingForYou, setIsLoadingForYou] = useState<boolean>(false);
  const [recommendationInsights, setRecommendationInsights] = useState<RecommendationInsights | null>(null);
  // Add this new state variable for analytics dashboard
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState<boolean>(false);
  // Update viewMode type to include 'for-you'
  const [viewMode, setViewMode] = useState<'category' | 'personalized' | 'random' | 'for-you'>('personalized');
  
  // Available interests for personalization
  const interests = ['technology', 'science', 'business', 'entertainment', 'health', 'sports', 'politics'];

  // Track when user views a category
  const trackCategoryView = (category: string) => {
    if (!isLoggedIn || !user) return;
    
    fetch('/api/track-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        activityType: 'view',
        category
      })
    }).catch(error => console.error('Error tracking category view:', error));
  };

  // Track when user clicks on an article
  const trackArticleClick = (article: NewsArticle) => {
    if (!isLoggedIn || !user) return;
    
    console.log('Tracking article click:', article.title, article.category);
    
    fetch('/api/track-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        activityType: 'click',
        category: article.category || 'unknown',
        articleTitle: article.title,
        articleUrl: article.url
      })
    }).catch(error => console.error('Error tracking article click:', error));
  };

  // Add this useEffect to track user sessions
  useEffect(() => {
    if (isLoggedIn && user) {
      fetch('/api/track-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          activityType: 'session'
        })
      }).catch(error => console.error('Error tracking session:', error));
    }
  }, [isLoggedIn, user]);

  // Add this useEffect to fetch 'For You' news
  // Add this useEffect to fetch 'For You' news
  useEffect(() => {
    if (isLoggedIn && user && viewMode === 'for-you') {
      setIsLoadingForYou(true);
      setForYouNews([]); // Clear previous results
      
      console.log('Fetching For You news for user:', user.id);
      
      fetch(`/api/for-you?userId=${user.id}`)
        .then(response => {
          console.log('API response status:', response.status);
          if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('For You data received:', data);
          if (data && data.articles && Array.isArray(data.articles)) {
            setForYouNews(data.articles);
            // Store recommendation insights if available
            if (data.recommendationInsights) {
              setRecommendationInsights(data.recommendationInsights);
            }
          } else {
            console.error('Invalid data format received:', data);
            // Fallback to empty array
            setForYouNews([]);
          }
        })
        .catch(error => {
          console.error('Error fetching for-you news:', error);
          // Show error in UI
          setForYouNews([]);
        })
        .finally(() => {
          setIsLoadingForYou(false);
        });
    }
  }, [isLoggedIn, user, viewMode]);

  // Check authentication status on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          throw new Error(`Authentication check failed: ${response.status}`);
        }
        const session = await response.json();
        
        if (session && session.user) {
          console.log('User authenticated:', session.user);
          setIsLoggedIn(true);
          setUser(session.user);
        } else {
          console.log('No authenticated user found');
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, [router.asPath]);

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
          // Track category view when fetching category news
          if (isLoggedIn && user) {
            trackCategoryView(selectedCategory);
          }
        } else if (viewMode === 'personalized') {
          // Fetch personalized news based on user preferences
          if (userPreferences.length > 0) {
            queryParams = `?preferences=${userPreferences.join(',')}`;
          } else {
            // If no preferences, default to random
            queryParams = '?random=true';
          }
        } else if (viewMode === 'random') {
          // Fetch random news from all categories
          queryParams = '?random=true';
        } else if (viewMode === 'for-you') {
          // Don't fetch regular news when in 'for-you' mode
          setIsLoading(false);
          return;
        }

        console.log(`Fetching news from: ${endpoint}${queryParams}`);
        const response = await fetch(`${endpoint}${queryParams}`);
        
        if (!response.ok) {
          throw new Error(`News API returned status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('News data received:', data);
        setNews(data);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };
  
    // Always fetch news, regardless of preferences
    fetchNews();
  }, [viewMode, selectedCategory, userPreferences, isLoggedIn, user]);

  // Save preferences when they change
  useEffect(() => {
    if (isLoggedIn && user && userPreferences.length > 0) {
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          preferences: userPreferences
        })
      }).catch(error => console.error('Error saving preferences:', error));
    }
  }, [userPreferences, isLoggedIn, user]);

  // Toggle category in user preferences
  const togglePreference = (category: string) => {
    // Instead of toggling, just set the selected category as the only preference
    setUserPreferences([category]);
  };

  // Handle category selection
  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setViewMode('category');
    // Track category view when selecting a category
    if (isLoggedIn && user) {
      trackCategoryView(category);
    }
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

  // Add a function to switch to 'For You' view
  const showForYou = () => {
    setViewMode('for-you');
    setSelectedCategory('');
  };

  // Handle login
  const handleLogin = () => {
    router.push('/login');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsLoggedIn(false);
        setUser(null);
        setUserPreferences([]);
        router.push('/');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      {/* Header with authentication */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b">
        <div className="logo">
          <h1 className="text-2xl font-bold text-blue-600">Personalized News</h1>
          <p className="text-sm text-gray-600">Stay informed with news that matters to you</p>
        </div>
        
        <div className="userSection">
          {isLoggedIn && user ? (
            <div className="flex items-center">
              <span className="mr-4 text-gray-700">
                Welcome, <span className="font-semibold">{user.name}</span>
              </span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button 
                onClick={handleLogin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                Sign In
              </button>
              <Link href="/register">
                <span className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm cursor-pointer">
                  Register
                </span>
              </Link>
            </div>
          )}
        </div>
      </header>
      
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
          {/* Add For You button */}
          <button 
            className={`px-4 py-2 rounded-full text-sm ${viewMode === 'for-you' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            onClick={showForYou}
          >
            <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            For You
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
      
      {/* User preferences section */}
      {viewMode !== 'for-you' && (
        <div className="preferencesSection mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Your Interests</h2>
          <div className="interestButtons flex flex-wrap gap-2">
            {interests.map(interest => (
              <button
                key={interest}
                className={`px-3 py-1 rounded-full text-xs ${userPreferences.includes(interest) 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}
                onClick={() => togglePreference(interest)}
              >
                {interest.charAt(0).toUpperCase() + interest.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* News display */}
      {viewMode !== 'for-you' ? (
        <>
          <div className="newsHeader mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              {viewMode === 'personalized' && (
                <>
                  <svg className="w-5 h-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Personalized News
                </>
              )}
              {viewMode === 'random' && (
                <>
                  <svg className="w-5 h-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  Random News
                </>
              )}
              {viewMode === 'category' && (
                <>
                  <svg className="w-5 h-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                  </svg>
                  {selectedCategory ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} News` : 'Category News'}
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
              {news && news.length > 0 ? (
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
                        onClick={() => trackArticleClick(article)}
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
                  <p className="text-gray-600">No news articles found. Try selecting different preferences or categories.</p>
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
        </>
      ) : (
        <>
          <div className="newsHeader mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Recommended For You
            </h2>
            <p className="text-sm text-gray-600 mt-1">Based on your reading history and preferences</p>
            
            {/* Enhanced recommendation insights section with detailed analytics */}
            {recommendationInsights && (
              <div className="mt-4 p-4 bg-purple-50 rounded-md border border-purple-100">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-semibold text-purple-800">Your Personalization Insights</h3>
                  <button 
                    className="text-xs text-purple-700 hover:text-purple-900 flex items-center"
                    onClick={() => setShowDetailedAnalytics(!showDetailedAnalytics)}
                  >
                    {showDetailedAnalytics ? 'Hide Details' : 'Show Details'}
                    <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      {showDetailedAnalytics 
                        ? <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        : <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      }
                    </svg>
                  </button>
                </div>
                
                <p className="text-xs text-purple-700 mt-2">{recommendationInsights.reason}</p>
              </div>
            )}
          </div>
            
            {isLoadingForYou ? (
              <div className="loadingState flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-gray-600">Personalizing your feed...</span>
              </div>
            ) : (
              <div className="newsContainer grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forYouNews && forYouNews.length > 0 ? (
                  forYouNews.map((article, index) => (
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
                        
                        {/* Add recommendation reason */}
                        {article.recommendationReason && (
                          <div className="mb-3 text-xs text-purple-700 italic">
                            <svg className="w-3 h-3 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            {article.recommendationReason}
                          </div>
                        )}
                        
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="articleLink inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={() => trackArticleClick(article)}
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
                  <p className="text-gray-600">We're still learning about your preferences. Browse more articles to get personalized recommendations.</p>
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
        </>
      )}
      
      {/* Categories section */}
      <div className="categoriesSection mt-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Browse by Category</h2>
        <div className="categoryButtons flex flex-wrap gap-2">
          {interests.map(category => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full text-sm ${selectedCategory === category 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              onClick={() => selectCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-12 pt-6 border-t text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Personalized News. All rights reserved.</p>
        <p className="mt-1">Powered by Next.js and News API</p>
      </footer>
    </div>
  );
}
