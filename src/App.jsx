import { useEffect, useState } from 'react';
import CreatorRoster from './components/CreatorRoster';
import ContentRequests from './components/ContentRequests';
import Analytics from './components/Analytics';
import { KaitoService } from './services/kaitoService';
import { GoogleSheetsService } from './services/googleSheetsService';
import ThemeToggle from './components/ThemeToggle';
import { IMPORTED_CREATORS } from './data/importedCreators';

// Google Sheets CSV export URL
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1J75nBdYNyQivMdi7XihhpYr6aXOnCNcJIAjTQLwjkXk/export?format=csv&gid=1537582832';

const DEFAULT_CREATORS = IMPORTED_CREATORS;

export default function App() {
  const [activeTab, setActiveTab] = useState('roster');
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState(() => {
    const stored = localStorage.getItem('creators');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse creators from localStorage:', e);
        return DEFAULT_CREATORS;
      }
    }
    return DEFAULT_CREATORS;
  });

  // Load requests for analytics
  const [requests, setRequests] = useState(() => {
    const stored = localStorage.getItem('requests');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse requests from localStorage:', e);
        return [];
      }
    }
    return [];
  });

  // Load creators from Google Sheets on mount
  useEffect(() => {
    const loadCreators = async () => {
      // Skip if no valid URL is configured
      if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL === 'YOUR_GOOGLE_SHEET_CSV_URL_HERE') {
        console.warn('Google Sheet URL not configured. Using local data.');
        setLoading(false);
        return;
      }

      try {
        const sheetsService = new GoogleSheetsService(GOOGLE_SHEET_URL);
        const loadedCreators = await sheetsService.fetchCreators();

        if (loadedCreators && loadedCreators.length > 0) {
          // Merge with existing posts data from localStorage
          const existingCreators = creators;
          const mergedCreators = loadedCreators.map(newCreator => {
            const existing = existingCreators.find(
              c => c.name.toLowerCase() === newCreator.name.toLowerCase() ||
                   c.handle.toLowerCase() === newCreator.handle.toLowerCase()
            );
            return {
              ...newCreator,
              posts: existing?.posts || [], // Preserve existing posts
              costPerPost: newCreator.costPerPost || existing?.costPerPost || '' // Preserve or update costPerPost
            };
          });

          setCreators(mergedCreators);
          console.log('Successfully loaded creators from Google Sheets');
        } else {
          console.warn('No creators found in Google Sheet, using existing data');
        }
      } catch (error) {
        console.error('Failed to load from Google Sheets, using existing data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCreators();
  }, []);

  // Save creators to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('creators', JSON.stringify(creators));
  }, [creators]);

  useEffect(() => {
    const kaito = new KaitoService();

    // initial pull
    kaito.updateCreatorData(creators);

    // weekly pull (7 days)
    const id = setInterval(() => {
      kaito.updateCreatorData(creators);
    }, 7 * 24 * 60 * 60 * 1000);

    return () => clearInterval(id);
  }, [creators]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-50">Creator Platform</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-60 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-3">
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors text-left ${
                activeTab === 'roster' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-l-4 border-red-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              Creator Roster
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors text-left ${
                activeTab === 'requests' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-l-4 border-red-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              Content Requests
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors text-left ${
                activeTab === 'analytics' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-l-4 border-red-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 dark:border-indigo-500 border-r-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading creators...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'roster' && <CreatorRoster creators={creators} setCreators={setCreators} />}
              {activeTab === 'requests' && <ContentRequests creators={creators} />}
              {activeTab === 'analytics' && <Analytics creators={creators} requests={requests} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
