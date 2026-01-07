import { useEffect, useState } from 'react';
import CreatorRoster from './components/CreatorRoster';
import ContentRequests from './components/ContentRequests';
import Analytics from './components/Analytics';
import Kaito from './components/Kaito';
import { GoogleSheetsService } from './services/googleSheetsService';
import ThemeToggle from './components/ThemeToggle';
import { IMPORTED_CREATORS } from './data/importedCreators';

// Google Sheets CSV export URL
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1J75nBdYNyQivMdi7XihhpYr6aXOnCNcJIAjTQLwjkXk/export?format=csv&gid=1537582832';

const DEFAULT_CREATORS = IMPORTED_CREATORS;

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('activeTab');
    return stored || 'roster';
  });
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

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors overflow-x-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-50">Creator Platform</h1>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Navigation - visible on small/medium screens */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 px-2">
        <nav className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'roster' ? 'bg-red-600 text-white rounded-t-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg'
            }`}
          >
            Roster
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'requests' ? 'bg-red-600 text-white rounded-t-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg'
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'analytics' ? 'bg-red-600 text-white rounded-t-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('kaito')}
            className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'kaito' ? 'bg-red-600 text-white rounded-t-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg'
            }`}
          >
            Kaito
          </button>
        </nav>
      </div>

      <div className="flex">
        {/* Sidebar - hidden on small/medium screens, visible on large+ */}
        <div className="hidden lg:block w-60 h-screen sticky top-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-3 overflow-y-auto">
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

            <button
              onClick={() => setActiveTab('kaito')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors text-left ${
                activeTab === 'kaito' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-l-4 border-red-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              Kaito
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-6 max-w-full">
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
              {activeTab === 'kaito' && <Kaito />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
