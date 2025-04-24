import { useState, useEffect } from 'react';

const Home = () => {
  const [userId, setUserId] = useState('user123'); // For now, we're using a fixed userId
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch news when the component mounts
  useEffect(() => {
    const fetchNews = async () => {
      if (!userId) {
        setError("User ID is required.");
        return;
      }

      setLoading(true);
      setError(null); // Reset previous errors

      try {
        const response = await fetch(`/api/news?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }

        const data = await response.json();
        setNews(data); // Set the news data
      } catch (err) {
        setError("Error fetching news. Please try again later.");
        console.error(err); // Log the error
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchNews();
  }, [userId]); // Re-fetch when userId changes

  return (
    <div className="container">
      <h1>Personalized News Feed</h1>
      
      {/* User Input for `userId` (You can later replace this with an actual user authentication) */}
      <div>
        <label htmlFor="userId">User ID:</label>
        <input
          id="userId"
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)} // Update userId state
          placeholder="Enter your user ID"
        />
      </div>

      {/* Loading, Error, and News Display */}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Display News Articles */}
      <div>
        {news.length > 0 ? (
          news.map((article, idx) => (
            <div key={idx} className="news-article">
              <h2>{article.title}</h2>
              <p>{article.description}</p>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                Read more
              </a>
            </div>
          ))
        ) : (
          !loading && <p>No news available for your interests.</p>
        )}
      </div>

      {/* Styling for the page */}
      <style jsx>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }

        h1 {
          text-align: center;
        }

        .news-article {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }

        input {
          padding: 8px;
          margin: 10px 0;
          width: 200px;
        }

        label {
          margin-right: 10px;
        }
      `}</style>
    </div>
  );
};

export default Home;
