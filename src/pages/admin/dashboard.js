import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Helper functions defined outside the component
function calculateAlignmentScore(userAnalytic) {
  if (!userAnalytic.user?.preferences?.interests || 
      !userAnalytic.categoryViews || 
      Object.keys(userAnalytic.categoryViews).length === 0) {
    return 0;
  }
  
  const interests = userAnalytic.user.preferences.interests;
  const categories = Object.keys(userAnalytic.categoryViews);
  
  // Count how many of the user's top 3 categories match their interests
  const topCategories = Object.entries(userAnalytic.categoryViews)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
  
  let matchCount = 0;
  topCategories.forEach(category => {
    if (interests.includes(category)) {
      matchCount++;
    }
  });
  
  // Calculate score based on matches (0-100)
  return Math.round((matchCount / Math.min(3, topCategories.length)) * 100);
}

function isAlignmentGood(userAnalytic) {
  return calculateAlignmentScore(userAnalytic) >= 60;
}

function getMostReadCategory(userAnalytic) {
  if (!userAnalytic.categoryViews || Object.keys(userAnalytic.categoryViews).length === 0) {
    return 'None';
  }
  
  const sortedCategories = Object.entries(userAnalytic.categoryViews)
    .sort((a, b) => b[1] - a[1]);
  
  return sortedCategories.length > 0 ? sortedCategories[0][0] : 'None';
}

function getRecommendation(userAnalytic) {
  const score = calculateAlignmentScore(userAnalytic);
  const mostRead = getMostReadCategory(userAnalytic);
  const interests = userAnalytic.user?.preferences?.interests || [];
  
  if (score < 40) {
    return `Consider suggesting more content from their selected interests: ${interests.join(', ')}`;
  } else if (score > 80) {
    return `This user has strong alignment with their interests. Consider suggesting some content outside their comfort zone for variety.`;
  } else if (!interests.includes(mostRead) && Object.values(userAnalytic.categoryViews || {})[0] > 10) {
    return `Consider suggesting they add "${mostRead}" to their interests since they read it frequently.`;
  } else {
    return `This user has a balanced reading pattern.`;
  }
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    // Check authentication and fetch analytics
    async function checkAuthAndFetchData() {
      try {
        const authRes = await fetch('/api/admin/auth');
        
        if (!authRes.ok) {
          console.error('Auth check failed:', await authRes.text());
          router.push('/login?redirect=/admin/dashboard');
          return;
        }
        
        // Add this to debug the auth response
        const authData = await authRes.json();
        console.log('Auth check successful:', authData);
        
        const analyticsRes = await fetch('/api/admin/analytics');
        if (!analyticsRes.ok) {
          console.error('Analytics fetch failed:', await analyticsRes.text());
          return;
        }
        
        const data = await analyticsRes.json();
        console.log('Analytics data received:', data);
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuthAndFetchData();
  }, [router]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Data Loading Error</h1>
        <p className="mb-4">Failed to load analytics data. Please try refreshing the page.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Admin Dashboard | Personalized News</title>
      </Head>
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium text-gray-700"
            >
              Back to Site
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'overview' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'users' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'interests' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'}`}
              onClick={() => setActiveTab('interests')}
            >
              Interests
            </button>
          </nav>
        </div>
        
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-blue-600">{analytics.userCount || 0}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Total Article Clicks</h3>
                <p className="text-3xl font-bold text-green-600">
                  {analytics.totalArticleClicks || 0}
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Most Popular Interest</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.interestPopularity && analytics.interestPopularity.length > 0 
                    ? analytics.interestPopularity[0].interest 
                    : 'None'}
                </p>
              </div>
            </div>
            
            {/* Add a new section for most clicked articles */}
            {analytics.topArticles && analytics.topArticles.length > 0 ? (
              <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Most Clicked Articles</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Clicked</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.topArticles.map((article, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">{article.title}</div>
                            {article.url && (
                              <a 
                                href={article.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                View Article
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{article.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{article.clickCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {article.lastClicked ? new Date(article.lastClicked).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Most Clicked Articles</h3>
                <p className="text-gray-500">No article click data available yet. This will populate as users interact with articles.</p>
              </div>
            )}
            
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Categories by Clicks</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.popularCategories && analytics.popularCategories.map((category, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'users' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">User Analytics</h2>
            
            {selectedUser ? (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Back to List
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="font-medium">{selectedUser.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium">{selectedUser.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Active</p>
                    <p className="font-medium">{new Date(selectedUser.lastActive).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Sessions</p>
                    <p className="font-medium">{selectedUser.sessionCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Article Clicks</p>
                    <p className="font-medium">{selectedUser.articleClicks || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Interest Alignment</p>
                    <p className="font-medium">{calculateAlignmentScore(selectedUser)}%</p>
                  </div>
                </div>
                
                {/* Add a section for user's clicked articles */}
                {analytics.userArticleClicks && selectedUser && analytics.userArticleClicks[selectedUser.userId] && analytics.userArticleClicks[selectedUser.userId].length > 0 ? (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Recently Clicked Articles</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicked At</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analytics.userArticleClicks[selectedUser.userId].map((click, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 line-clamp-1">{click.title}</div>
                                {click.url && (
                                  <a 
                                    href={click.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    View Article
                                  </a>
                                )}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{click.category}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                {new Date(click.clickedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : selectedUser ? (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Recently Clicked Articles</h4>
                    <p className="text-gray-500">No article click data available for this user yet.</p>
                  </div>
                ) : null}
                
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Category Clicks</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedUser.categoryViews && Object.entries(selectedUser.categoryViews).map(([category, count]) => (
                      <div key={category} className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-900">{category}</p>
                        <p className="text-lg font-bold text-blue-600">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-md font-medium text-yellow-800 mb-2">Recommendation</h4>
                  <p className="text-sm text-yellow-700">{getRecommendation(selectedUser)}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Most Read</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alignment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.userAnalytics && analytics.userAnalytics.map((userAnalytic, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{userAnalytic.user?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{userAnalytic.user?.email || 'No email'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {userAnalytic.lastActive ? new Date(userAnalytic.lastActive).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {userAnalytic.sessionCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getMostReadCategory(userAnalytic)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {calculateAlignmentScore(userAnalytic)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => setSelectedUser(userAnalytic)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'interests' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">User Interests Analysis</h2>
            
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Interest Popularity</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.interestPopularity && analytics.interestPopularity.map((interest, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{interest.interest}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{interest.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{interest.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Interest Correlations</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Articles Read</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.interestCorrelations && analytics.interestCorrelations.map((correlation, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{correlation.interest}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {correlation.topCategory || 'None'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {correlation.userCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {correlation.avgArticlesRead ? correlation.avgArticlesRead.toFixed(1) : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
