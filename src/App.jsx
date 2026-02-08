import { useEffect, useState } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/clerk-react';
import CreatorRosterPage from './components/roster/CreatorRosterPage';
import CreatorProspectsPage from './components/roster/CreatorProspectsPage';
import ContentRequestsEditorial from './components/ContentRequestsEditorial';
import { Campaigns } from './components/Campaigns';
import Analytics from './components/Analytics';
import FlashCampaignManager from './components/FlashCampaignManager';
import BotAnalyticsEditorial from './components/BotAnalyticsEditorial';
import ChannelManagerEditorial from './components/ChannelManagerEditorial';
import SocialConnections from './components/SocialConnections';
import { GoogleSheetsService } from './services/googleSheetsService';
import ThemeToggle from './components/ThemeToggle';
import { IMPORTED_CREATORS } from './data/importedCreators';
import { getCreators, bulkImportCreators } from './services/creatorsServiceSupabase';
import { getCampaigns } from './services/campaignsServiceSupabase';
import { supabase } from './lib/supabaseClient';
import SignInPage from './components/auth/SignInPage';

// Google Sheets CSV export URL
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1J75nBdYNyQivMdi7XihhpYr6aXOnCNcJIAjTQLwjkXk/export?format=csv&gid=1537582832';

const DEFAULT_CREATORS = IMPORTED_CREATORS;

export default function App({ bypassAuth = false }) {
  // Render different component based on auth mode
  if (bypassAuth) {
    return <AppWithoutAuth />;
  }
  return <AppWithAuth />;
}

// Component for bypassed auth mode
function AppWithoutAuth() {
  return <AdminView bypassAuth={true} />;
}

// Component with Clerk authentication
function AppWithAuth() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  // Show loading while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--color-accent-primary)] border-r-transparent"></div>
          <p className="mt-4 text-[var(--color-text-secondary)] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign in page if not authenticated
  if (!isSignedIn) {
    return <SignInPage />;
  }

  // For now, all authenticated users see the admin view
  return <AdminView bypassAuth={false} />;
}

function AdminView({ bypassAuth = false }) {
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('activeTab');
    // Default to channels tab now that roster/requests/analytics are hidden
    return stored || 'channels';
  });
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState([]);
  const [prospects, setProspects] = useState([]);
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
          const [allCreators, loadedRequests] = await Promise.all([
            getCreators(),
            getCampaigns()
          ]);

          // If Supabase returns empty data (likely due to placeholder credentials),
          // fallback to localStorage/DEFAULT_CREATORS
          if (allCreators.length === 0) {
            console.warn('[App] Supabase returned no data. Falling back to localStorage/default data...');
            loadFromLocalStorage();
          } else {
            // Split creators by status
            const activeCreators = allCreators.filter(c => c.status === 'active' || !c.status);
            const prospectCreators = allCreators.filter(c => c.status === 'prospect');

            setCreators(activeCreators);
            setProspects(prospectCreators);
            setRequests(loadedRequests);
            console.log(`[App] ✓ Loaded ${activeCreators.length} active creators, ${prospectCreators.length} prospects, and ${loadedRequests.length} requests from Supabase`);
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
    if (!loading && prospects.length > 0) {
      localStorage.setItem('prospects', JSON.stringify(prospects));
    }
  }, [prospects, loading]);

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
      <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-6 py-3 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-primary)] flex items-center justify-center">
              <span className="text-white text-lg font-bold">C</span>
            </div>
            <div>
              <h1 className="text-display text-lg text-[var(--color-text-primary)] tracking-tight">Creator Analytics</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!bypassAuth && <UserButton afterSignOutUrl="/" />}
            {bypassAuth && (
              <div className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                Dev Mode
              </div>
            )}
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
                ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] rounded-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg'
            }`}
          >
            Roster
          </button>
          <button
            onClick={() => setActiveTab('prospects')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'prospects'
                ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] rounded-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg'
            }`}
          >
            Prospects
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'requests'
                ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] rounded-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] rounded-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg'
            }`}
          >
            Analytics
          </button>
          {/* Hidden: Kaito tab */}
          {/* <button
            onClick={() => setActiveTab('kaito')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'kaito'
                ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] rounded-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg'
            }`}
          >
            Kaito
          </button> */}
          <button
            onClick={() => setActiveTab('botanalytics')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'botanalytics'
                ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] rounded-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg'
            }`}
          >
            Bot Analytics
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'channels'
                ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] rounded-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg'
            }`}
          >
            Channels
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'social'
                ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] rounded-lg'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg'
            }`}
          >
            Social Accounts
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
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] border-l-2 border-l-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Creator Roster
            </button>

            <button
              onClick={() => setActiveTab('prospects')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'prospects'
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] border-l-2 border-l-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Creator Prospects
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'requests'
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] border-l-2 border-l-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Campaigns
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'analytics'
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] border-l-2 border-l-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Analytics
            </button>

            {/* Hidden: Kaito tab */}
            {/* <button
              onClick={() => setActiveTab('kaito')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'kaito'
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] border-l-2 border-l-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Kaito Leaderboard
            </button> */}

            <button
              onClick={() => setActiveTab('botanalytics')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'botanalytics'
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] border-l-2 border-l-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Bot Analytics
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'channels'
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] border-l-2 border-l-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Channel Manager
            </button>

            <button
              onClick={() => setActiveTab('social')}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                activeTab === 'social'
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] border-l-2 border-l-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              Social Accounts
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-6 max-w-full">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--color-accent-primary)] border-r-transparent"></div>
                <p className="mt-4 text-[var(--color-text-secondary)] font-medium">Loading creators...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'roster' && <CreatorRosterPage creators={creators} setCreators={setCreators} />}
              {activeTab === 'prospects' && <CreatorProspectsPage prospects={prospects} setProspects={setProspects} setCreators={setCreators} />}
              {activeTab === 'requests' && <Campaigns />}
              {activeTab === 'analytics' && <Analytics creators={creators} requests={requests} />}
              {/* Hidden: Kaito tab content */}
              {/* {activeTab === 'kaito' && <FlashCampaignManager />} */}
              {activeTab === 'botanalytics' && <BotAnalyticsEditorial />}
              {activeTab === 'channels' && <ChannelManagerEditorial />}
              {activeTab === 'social' && <SocialConnections />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
