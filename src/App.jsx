import { useEffect, useState } from 'react';
import CreatorRoster from './components/CreatorRoster';
import ContentRequests from './components/ContentRequests';
import Analytics from './components/Analytics';
import KaitoEditorial from './components/KaitoEditorial';
import BotAnalyticsEditorial from './components/BotAnalyticsEditorial';
import ChannelManagerEditorial from './components/ChannelManagerEditorial';
import { GoogleSheetsService } from './services/googleSheetsService';
import ThemeToggle from './components/ThemeToggle';
import { IMPORTED_CREATORS } from './data/importedCreators';

// Google Sheets CSV export URL
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1J75nBdYNyQivMdi7XihhpYr6aXOnCNcJIAjTQLwjkXk/export?format=csv&gid=1537582832';

const DEFAULT_CREATORS = IMPORTED_CREATORS;

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('activeTab');
    // Default to channels tab now that roster/requests/analytics are hidden
    return stored || 'channels';
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
              costPerPost: newCreator.costPerPost || existing?.costPerPost || '', // Preserve or update costPerPost
              platforms: existing?.platforms || newCreator.platforms || [] // Preserve platforms
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
    <div className="min-h-screen w-full bg-[var(--color-bg-primary)] transition-colors overflow-x-hidden">
      {/* Header */}
      <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-6 py-5 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center">
              <span className="text-display text-white text-xl font-bold">P</span>
            </div>
            <div>
              <h1 className="text-display text-2xl text-[var(--color-text-primary)] tracking-tight">Polygon Analytics</h1>
              <p className="text-xs text-[var(--color-text-tertiary)] text-mono uppercase tracking-wider">Creator Intelligence Platform</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Navigation - visible on small/medium screens */}
      <div className="lg:hidden bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-2">
        <nav className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'roster'
                ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-t-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-t-lg'
            }`}
          >
            Roster
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-t-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-t-lg'
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setActiveTab('kaito')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'kaito'
                ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-t-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-t-lg'
            }`}
          >
            Kaito
          </button>
          <button
            onClick={() => setActiveTab('botanalytics')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'botanalytics'
                ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-t-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-t-lg'
            }`}
          >
            Bot Analytics
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'channels'
                ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-t-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-t-lg'
            }`}
          >
            Channels
          </button>
        </nav>
      </div>

      <div className="flex">
        {/* Sidebar - hidden on small/medium screens, visible on large+ */}
        <div className="hidden lg:block w-60 h-screen sticky top-[73px] bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] py-6 overflow-y-auto">
          <nav className="flex flex-col gap-2 px-4">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'roster'
                  ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Creator Roster
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Content Requests
            </button>

            <button
              onClick={() => setActiveTab('kaito')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'kaito'
                  ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Kaito Leaderboard
            </button>

            <button
              onClick={() => setActiveTab('botanalytics')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'botanalytics'
                  ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Bot Analytics
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'channels'
                  ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Channel Manager
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-6 max-w-full bg-polygon-bg-primary">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-polygon-primary border-r-transparent"></div>
                <p className="mt-4 text-polygon-text-secondary font-medium">Loading creators...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'roster' && <CreatorRoster creators={creators} setCreators={setCreators} />}
              {activeTab === 'requests' && <ContentRequests creators={creators} />}
              {activeTab === 'analytics' && <Analytics creators={creators} requests={requests} />}
              {activeTab === 'kaito' && <KaitoEditorial />}
              {activeTab === 'botanalytics' && <BotAnalyticsEditorial />}
              {activeTab === 'channels' && <ChannelManagerEditorial />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
