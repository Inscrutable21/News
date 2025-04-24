# Microsoft-Styled Personalized News Application

A modern news aggregation application with Microsoft Fluent Design styling that personalizes content based on user preferences. This application allows users to browse news by categories, view personalized content based on their interests, and discover random news tailored to their preferences.

![Personalized News App Screenshot](https://via.placeholder.com/800x450.png?text=Personalized+News+App)

## Features

- **Microsoft Fluent Design System**: Modern UI with Microsoft's design language
- **Dark/Light Mode Support**: Automatic theme detection based on system preferences
- **Personalized News Feed**: Content curated based on user interests
- **Multiple View Modes**:
  - **My News**: Personalized feed based on selected interests
  - **Random**: Discovery mode with a bias toward user preferences
  - **Categories**: Browse news by specific categories
- **Preference Management**: Save and manage news category preferences
- **Responsive Layout**: Works on desktop and mobile devices
- **Local Storage**: Remembers user preferences between sessions

## Technologies Used

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: For type safety and better developer experience
- **News API**: External API for fetching news articles
- **CSS Variables**: For theme management
- **LocalStorage API**: For persisting user preferences

## Getting Started

### Prerequisites

- Node.js 14.0.0 or later
- npm or yarn
- News API Key ([Get one here](https://newsapi.org/register))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/personalized-news.git
   cd personalized-news
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add your News API key:
   ```
   NEWS_API_KEY=your_api_key_here
   ```

### Running the application

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. **View Modes**: Switch between "My News", "Random", or specific categories using the buttons at the top
2. **Setting Preferences**: Select your interests in the "My Interests" section
3. **Browsing Categories**: Click on any category in the "Categories" section to view news from that specific category
4. **Reading Articles**: Click "Read more" on any article card to open the full article on the source website

## Project Structure

```
/src
  /lib
    newsAPI.js         # News API integration and data fetching
  /pages
    _app.tsx           # Next.js App component with global styles
    index.tsx          # Main news page with personalization features
    /api
      news.js          # API route for fetching news
  /styles
    globals.css        # Global styles with Microsoft design variables
```

## Customization

### Adding New Categories

To add new news categories, update the categories array in the following files:
- `src/pages/index.tsx`
- `src/lib/newsAPI.js`

### Changing the Default Preferences

Modify the default preferences in `src/pages/index.tsx`:

```typescript
const defaultPreferences = ['your', 'preferred', 'categories'];
```

## Deployment

This application can be easily deployed to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/personalized-news)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [News API](https://newsapi.org/) for providing the news data
- [Microsoft Fluent Design System](https://www.microsoft.com/design/fluent/) for design inspiration
- [Next.js](https://nextjs.org/) for the React framework
