import { useEffect, useState } from 'react';
import CreatorRoster from './components/CreatorRoster';
import ContentRequests from './components/ContentRequests';
import Analytics from './components/Analytics';
import { KaitoService } from './services/kaitoService';
import { GoogleSheetsService } from './services/googleSheetsService';
import ThemeToggle from './components/ThemeToggle';

// Google Sheets CSV export URL
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Ge4wZiL_grX_hFups8A50HawZ2GxXFyDmCc-kNDs_5A/export?format=csv&gid=1537582832';

const DEFAULT_CREATORS = [
  { id: 1, name: "Joshua Jake", handle: "@joshua_jake", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 2, name: "Crypto Wendy", handle: "@crypto_wendy", notes: "4 posts, $15,000.00 total", costPerPost: '', posts: [] },
  { id: 3, name: "Rise Up Morning Show", handle: "@rise_up_morning_show", notes: "15 posts, $6,000.00 total", costPerPost: '', posts: [] },
  { id: 4, name: "Crypto with Leo", handle: "@crypto_with_leo", notes: "7 posts, $8,750.00 total", costPerPost: '', posts: [] },
  { id: 5, name: "Jolly Green Investor", handle: "@jolly_green_investor", notes: "4 posts, $12,000.00 total", costPerPost: '', posts: [] },
  { id: 6, name: "Bodoggos", handle: "@bodoggos", notes: "3 posts, $9,999.00 total", costPerPost: '', posts: [] },
  { id: 7, name: "Wale.Moca", handle: "@walemoca", notes: "1 posts, $2,500.00 total", costPerPost: '', posts: [] },
  { id: 8, name: "When Shift Happens", handle: "@when_shift_happens", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 9, name: "Star Platinum", handle: "@star_platinum", notes: "1 posts, $2,500.00 total", costPerPost: '', posts: [] },
  { id: 10, name: "Pix", handle: "@pix", notes: "1 posts, $2,500.00 total", costPerPost: '', posts: [] },
  { id: 11, name: "Andrew Asks", handle: "@andrew_asks", notes: "2 posts, $2,500.00 total", costPerPost: '', posts: [] },
  { id: 12, name: "Crypto Meg/Mason", handle: "@crypto_megmason", notes: "2 posts, $2,000.00 total", costPerPost: '', posts: [] },
  { id: 13, name: "Coach Ty", handle: "@coach_ty", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 14, name: "Crypto Ed", handle: "@crypto_ed", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 15, name: "Youngsun", handle: "@youngsun", notes: "1 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 16, name: "House of Crypto", handle: "@house_of_crypto", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 17, name: "Crypto Banter", handle: "@crypto_banter", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 18, name: "Crypto Kid", handle: "@crypto_kid", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 19, name: "Virtual Bacon", handle: "@virtual_bacon", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 20, name: "Lab of Crypto", handle: "@lab_of_crypto", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 21, name: "Hustlepedia", handle: "@hustlepedia", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 22, name: "No BS Crypto", handle: "@no_bs_crypto", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 23, name: "Bitcoin Strategy", handle: "@bitcoin_strategy", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 24, name: "The Crypto Lark", handle: "@the_crypto_lark", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 25, name: "Tim Warren", handle: "@tim_warren", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 26, name: "Ivan on Tech", handle: "@ivan_on_tech", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 27, name: "Blockmates", handle: "@blockmates", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 28, name: "Americana Crypto", handle: "@americana_crypto", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 29, name: "Nifty Investor", handle: "@nifty_investor", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 30, name: "Crypto Crush", handle: "@crypto_crush", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] }
];

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
              {activeTab === 'analytics' && <Analytics creators={creators} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
