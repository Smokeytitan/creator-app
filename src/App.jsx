import { useEffect, useState } from 'react';
import CreatorRosterEditorial from './components/CreatorRosterEditorial';
import ContentRequestsEditorial from './components/ContentRequestsEditorial';
import Analytics from './components/Analytics';
import FlashCampaignManager from './components/FlashCampaignManager';
import BotAnalyticsEditorial from './components/BotAnalyticsEditorial';
import ChannelManagerEditorial from './components/ChannelManagerEditorial';
import { GoogleSheetsService } from './services/googleSheetsService';
import ThemeToggle from './components/ThemeToggle';
import { IMPORTED_CREATORS } from './data/importedCreators';
import { getCreators, bulkImportCreators } from './services/creatorsServiceSupabase';
import { getCampaigns } from './services/campaignsServiceSupabase';
import { supabase } from './lib/supabaseClient';

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
  const [creators, setCreators] = useState([]);
  const [requests, setRequests] = useState([]);
  const [useSupabase, setUseSupabase] = useState(!!supabase);

  // Load data on mount (Supabase or localStorage fallback)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      if (useSupabase) {
        // Load from Supabase
        console.log('[App] Loading data from Supabase...');
        try {
          const [loadedCreators, loadedRequests] = await Promise.all([
            getCreators(),
            getCampaigns()
          ]);

          setCreators(loadedCreators);
          setRequests(loadedRequests);
          console.log(`[App] ✓ Loaded ${loadedCreators.length} creators and ${loadedRequests.length} requests from Supabase`);

          // If Supabase is empty but localStorage has data, prompt for migration
          if (loadedCreators.length === 0) {
            const localCreators = localStorage.getItem('creators');
            if (localCreators && JSON.parse(localCreators).length > 0) {
              console.warn('[App] Supabase is empty but localStorage has data. Consider running migration.');
              // You could show a migration prompt here
            }
          }
        } catch (error) {
          console.error('[App] Error loading from Supabase:', error);
          // Fallback to localStorage
          console.log('[App] Falling back to localStorage...');
          loadFromLocalStorage();
        }
      } else {
        // Load from localStorage
        console.log('[App] Supabase not configured. Using localStorage.');
        loadFromLocalStorage();
      }

      // Skip Google Sheets merge when using Supabase (data should be imported via import script)
      // Try to merge with Google Sheets data only if NOT using Supabase
      if (!useSupabase && GOOGLE_SHEET_URL && GOOGLE_SHEET_URL !== 'YOUR_GOOGLE_SHEET_CSV_URL_HERE') {
        try {
          const sheetsService = new GoogleSheetsService(GOOGLE_SHEET_URL);
          const loadedCreators = await sheetsService.fetchCreators();

          if (loadedCreators && loadedCreators.length > 0) {
            setCreators(existingCreators => {
              // Merge Google Sheets creators with existing data
              const mergedCreators = loadedCreators.map(newCreator => {
                const existing = existingCreators.find(
                  c => c.name.toLowerCase() === newCreator.name.toLowerCase() ||
                       c.handle.toLowerCase() === newCreator.handle.toLowerCase()
                );
                return {
                  ...newCreator,
                  posts: existing?.posts || [],
                  costPerPost: newCreator.costPerPost || existing?.costPerPost || '',
                  platforms: existing?.platforms || newCreator.platforms || []
                };
              });

              // Add any locally-created creators that aren't in Google Sheets
              const loadedHandles = new Set(loadedCreators.map(c => c.handle.toLowerCase()));
              const localOnlyCreators = existingCreators.filter(
                c => !loadedHandles.has(c.handle.toLowerCase())
              );

              const finalCreators = [...mergedCreators, ...localOnlyCreators];

              return finalCreators;
            });
            console.log('[App] ✓ Merged with Google Sheets data');
          }
        } catch (error) {
          console.error('[App] Failed to load from Google Sheets:', error);
        }
      }

      setLoading(false);
    };

    const loadFromLocalStorage = () => {
      const storedCreators = localStorage.getItem('creators');
      const storedRequests = localStorage.getItem('requests');

      const parsedCreators = storedCreators
        ? JSON.parse(storedCreators)
        : DEFAULT_CREATORS;

      const parsedRequests = storedRequests
        ? JSON.parse(storedRequests)
        : [];

      setCreators(parsedCreators);
      setRequests(parsedRequests);
      console.log('[App] ✓ Loaded from localStorage');
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Save to localStorage as backup (even when using Supabase)
  useEffect(() => {
    if (!loading && creators.length > 0) {
      localStorage.setItem('creators', JSON.stringify(creators));
    }
  }, [creators, loading]);

  useEffect(() => {
    if (!loading && requests.length > 0) {
      localStorage.setItem('requests', JSON.stringify(requests));
    }
  }, [requests, loading]);

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
          <div className="flex items-center gap-3">
            {useSupabase && (
              <button
                onClick={() => {
                  if (window.confirm('Clear local cache and reload? This will remove all localStorage data.')) {
                    // Save current tab and theme before clearing
                    const currentTab = localStorage.getItem('activeTab');
                    const currentTheme = localStorage.getItem('theme-mode');
                    localStorage.clear();
                    // Restore tab and theme
                    if (currentTab) localStorage.setItem('activeTab', currentTab);
                    if (currentTheme) localStorage.setItem('theme-mode', currentTheme);
                    window.location.reload();
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all"
                title="Clear localStorage cache"
              >
                Clear Cache
              </button>
            )}
            <ThemeToggle />
          </div>
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
            Campaigns
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
              Campaigns
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
              {activeTab === 'roster' && <CreatorRosterEditorial creators={creators} setCreators={setCreators} />}
              {activeTab === 'requests' && <ContentRequestsEditorial creators={creators} setCreators={setCreators} requests={requests} setRequests={setRequests} />}
              {activeTab === 'analytics' && <Analytics creators={creators} requests={requests} />}
              {activeTab === 'kaito' && <FlashCampaignManager />}
              {activeTab === 'botanalytics' && <BotAnalyticsEditorial />}
              {activeTab === 'channels' && <ChannelManagerEditorial />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
