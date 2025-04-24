import { useState, useEffect } from 'react';

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

export default function Home() {
  // State for news articles
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // User preferences state
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'category' | 'personalized' | 'random'>('personalized');
  
  // Available categories
  const categories = ['technology', 'science', 'business', 'entertainment', 'health', 'sports', 'politics'];

  // Load user preferences from localStorage on initial load
  useEffect(() => {
    const savedPreferences = localStorage.getItem('newsPreferences');
    if (savedPreferences) {
      setUserPreferences(JSON.parse(savedPreferences));
    } else {
      // Default preferences if none saved
      const defaultPreferences = ['technology', 'science'];
      setUserPreferences(defaultPreferences);
      localStorage.setItem('newsPreferences', JSON.stringify(defaultPreferences));
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (userPreferences.length > 0) {
      localStorage.setItem('newsPreferences', JSON.stringify(userPreferences));
    }
  }, [userPreferences]);

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

    fetchNews();
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

  return (
    <div className="container">
      <div className="header">
        <h1>Microsoft News</h1>
      </div>
      
      {/* View mode selection */}
      <div className="viewModeSection">
        <h2>View Mode</h2>
        <div className="categoryButtons">
          <button 
            className={`ms-button ${viewMode === 'personalized' ? 'active' : ''}`}
            onClick={showPersonalized}
          >
            My News
          </button>
          <button 
            className={`ms-button ${viewMode === 'random' ? 'active' : ''}`}
            onClick={showRandom}
          >
            Random
          </button>
          {selectedCategory && (
            <button 
              className={`ms-button ${viewMode === 'category' ? 'active' : ''}`}
            >
              {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </button>
          )}
        </div>
      </div>
      
      {/* Categories */}
      <div className="categorySection">
        <h2>Categories</h2>
        <div className="categoryButtons">
          {categories.map((category) => (
            <button 
              key={category}
              className={`ms-button ${selectedCategory === category && viewMode === 'category' ? 'active' : ''}`}
              onClick={() => selectCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* User preferences */}
      <div className="preferencesSection">
        <h2>My Interests</h2>
        <p className="preferencesNote">Select topics you're interested in to personalize your feed:</p>
        <div className="categoryButtons">
          {categories.map((category) => (
            <button 
              key={`pref-${category}`}
              className={`ms-button ${userPreferences.includes(category) ? 'active' : ''}`}
              onClick={() => togglePreference(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* News display */}
      <div className="newsHeader">
        <h2>
          {viewMode === 'personalized' && 'Personalized For You'}
          {viewMode === 'random' && 'Random News'}
          {viewMode === 'category' && `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} News`}
        </h2>
      </div>
      
      {isLoading ? (
        <div className="loadingState">Loading news...</div>
      ) : (
        <div className="newsContainer">
          {news.length > 0 ? (
            news.map((article, index) => (
              <div key={index} className="newsArticle">
                {article.urlToImage && (
                  <img 
                    src={article.urlToImage} 
                    alt={article.title} 
                    className="articleImage"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="articleContent">
                  {article.source?.name && (
                    <div className="articleSource">{article.source.name}</div>
                  )}
                  <h3>{article.title}</h3>
                  <p>{article.description}</p>
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="articleLink"
                  >
                    Read more
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="noNewsMessage">No articles found. Try selecting different categories.</div>
          )}
        </div>
      )}
    </div>
  );
}