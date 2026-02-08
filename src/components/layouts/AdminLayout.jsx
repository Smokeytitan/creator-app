import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { ExternalLink } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { GoogleSheetsService } from '../../services/googleSheetsService';
import { IMPORTED_CREATORS } from '../../data/importedCreators';
import { getCreators } from '../../services/creatorsServiceSupabase';
import { getCampaigns } from '../../services/campaignsServiceSupabase';
import { supabase } from '../../lib/supabaseClient';

// Google Sheets CSV export URL
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1J75nBdYNyQivMdi7XihhpYr6aXOnCNcJIAjTQLwjkXk/export?format=csv&gid=1537582832';

const DEFAULT_CREATORS = IMPORTED_CREATORS;

/**
 * Map route segments to the sidebar/mobile nav tab identifiers.
 * Used to determine which nav item is "active" based on the current URL.
 */
const NAV_ITEMS = [
  { key: 'roster',    path: '/admin/roster',    label: 'Creator Roster',    mobileLabel: 'Roster' },
  { key: 'prospects', path: '/admin/prospects',  label: 'Creator Prospects', mobileLabel: 'Prospects' },
  { key: 'campaigns', path: '/admin/campaigns',  label: 'Campaigns',         mobileLabel: 'Campaigns' },
  { key: 'analytics', path: '/admin/analytics',  label: 'Analytics',         mobileLabel: 'Analytics' },
  { key: 'users',     path: '/admin/users',      label: 'Users',             mobileLabel: 'Users' },
];

export default function AdminLayout({ bypassAuth = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [useSupabaseFlag] = useState(!!supabase);

  // Determine the active nav key from the current pathname
  const activeKey = getActiveKey(location.pathname);

  // Persist active tab to localStorage for backward compat
  useEffect(() => {
    if (activeKey) {
      localStorage.setItem('activeTab', activeKey);
    }
  }, [activeKey]);

  // Load data on mount (Supabase or localStorage fallback)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      if (useSupabaseFlag) {
        // Load from Supabase
        console.log('[AdminLayout] Loading data from Supabase...');
        try {
          const [allCreators, loadedRequests] = await Promise.all([
            getCreators(),
            getCampaigns()
          ]);

          // If Supabase returns empty data (likely due to placeholder credentials),
          // fallback to localStorage/DEFAULT_CREATORS
          if (allCreators.length === 0) {
            console.warn('[AdminLayout] Supabase returned no data. Falling back to localStorage/default data...');
            loadFromLocalStorage();
          } else {
            // Split creators by status
            const activeCreators = allCreators.filter(c => c.status === 'active' || !c.status);
            const prospectCreators = allCreators.filter(c => c.status === 'prospect');

            setCreators(activeCreators);
            setProspects(prospectCreators);
            setRequests(loadedRequests);
            console.log(`[AdminLayout] Loaded ${activeCreators.length} active creators, ${prospectCreators.length} prospects, and ${loadedRequests.length} requests from Supabase`);
          }
        } catch (error) {
          console.error('[AdminLayout] Error loading from Supabase:', error);
          // Fallback to localStorage
          console.log('[AdminLayout] Falling back to localStorage...');
          loadFromLocalStorage();
        }
      } else {
        // Load from localStorage
        console.log('[AdminLayout] Supabase not configured. Using localStorage.');
        loadFromLocalStorage();
      }

      // Skip Google Sheets merge when using Supabase (data should be imported via import script)
      // Try to merge with Google Sheets data only if NOT using Supabase
      if (!useSupabaseFlag && GOOGLE_SHEET_URL && GOOGLE_SHEET_URL !== 'YOUR_GOOGLE_SHEET_CSV_URL_HERE') {
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
            console.log('[AdminLayout] Merged with Google Sheets data');
          }
        } catch (error) {
          console.error('[AdminLayout] Failed to load from Google Sheets:', error);
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
      console.log('[AdminLayout] Loaded from localStorage');
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

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-primary)] transition-colors overflow-x-hidden">
      {/* Header */}
      <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-6 py-3 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-primary)] flex items-center justify-center">
                <span className="text-white text-lg font-bold">C</span>
              </div>
              <div>
                <h1 className="text-display text-lg text-[var(--color-text-primary)] tracking-tight">Creator Analytics</h1>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
            >
              <ExternalLink size={14} />
              Creator Portal
            </Link>
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
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                activeKey === item.key
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] rounded-lg'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg'
              }`}
            >
              {item.mobileLabel}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex">
        {/* Sidebar - hidden on small/medium screens, visible on large+ */}
        <div className="hidden lg:block w-60 h-screen sticky top-[73px] bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] py-6 overflow-y-auto">
          <nav className="flex flex-col gap-2 px-4">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`px-4 py-3 text-sm font-semibold transition-all duration-200 text-left rounded-lg ${
                  activeKey === item.key
                    ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)] border-l-2 border-l-[var(--color-accent-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
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
            <Outlet context={{ creators, setCreators, prospects, setProspects, requests, setRequests }} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Determine the active navigation key based on the current pathname.
 * Falls back to 'roster' for the bare /admin path.
 */
function getActiveKey(pathname) {
  for (const item of NAV_ITEMS) {
    if (pathname.startsWith(item.path)) {
      return item.key;
    }
  }
  // Default for /admin with no sub-path
  return 'roster';
}
