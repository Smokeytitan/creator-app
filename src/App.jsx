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
  { id: 1, name: "Joshua Jake", handle: "@joshua_jake", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 2, name: "Crypto Wendy", handle: "@crypto_wendy", tier: "B", notes: "4 posts, $15,000.00 total", costPerPost: '', posts: [] },
  { id: 3, name: "Rise Up Morning Show", handle: "@rise_up_morning_show", tier: "A", notes: "15 posts, $6,000.00 total", costPerPost: '', posts: [] },
  { id: 4, name: "Crypto with Leo", handle: "@crypto_with_leo", tier: "A", notes: "7 posts, $8,750.00 total", costPerPost: '', posts: [] },
  { id: 5, name: "Jolly Green Investor", handle: "@jolly_green_investor", tier: "B", notes: "4 posts, $12,000.00 total", costPerPost: '', posts: [] },
  { id: 6, name: "Bodoggos", handle: "@bodoggos", tier: "B", notes: "3 posts, $9,999.00 total", costPerPost: '', posts: [] },
  { id: 7, name: "Wale.Moca", handle: "@walemoca", tier: "C", notes: "1 posts, $2,500.00 total", costPerPost: '', posts: [] },
  { id: 8, name: "When Shift Happens", handle: "@when_shift_happens", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 9, name: "Star Platinum", handle: "@star_platinum", tier: "C", notes: "1 posts, $2,500.00 total", costPerPost: '', posts: [] },
  { id: 10, name: "Pix", handle: "@pix", tier: "C", notes: "1 posts, $2,500.00 total", costPerPost: '', posts: [] },
  { id: 11, name: "Andrew Asks", handle: "@andrew_asks", tier: "B", notes: "2 posts, $2,500.00 total", costPerPost: '', posts: [] },
  { id: 12, name: "Crypto Meg/Mason", handle: "@crypto_megmason", tier: "B", notes: "2 posts, $2,000.00 total", costPerPost: '', posts: [] },
  { id: 13, name: "Coach Ty", handle: "@coach_ty", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 14, name: "Crypto Ed", handle: "@crypto_ed", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 15, name: "Youngsun", handle: "@youngsun", tier: "C", notes: "1 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 16, name: "House of Crypto", handle: "@house_of_crypto", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 17, name: "Crypto Banter", handle: "@crypto_banter", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 18, name: "Crypto Kid", handle: "@crypto_kid", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 19, name: "Virtual Bacon", handle: "@virtual_bacon", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 20, name: "Lab of Crypto", handle: "@lab_of_crypto", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 21, name: "Hustlepedia", handle: "@hustlepedia", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 22, name: "No BS Crypto", handle: "@no_bs_crypto", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 23, name: "Bitcoin Strategy", handle: "@bitcoin_strategy", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 24, name: "The Crypto Lark", handle: "@the_crypto_lark", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 25, name: "Tim Warren", handle: "@tim_warren", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 26, name: "Ivan on Tech", handle: "@ivan_on_tech", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 27, name: "Blockmates", handle: "@blockmates", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 28, name: "Americana Crypto", handle: "@americana_crypto", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 29, name: "Nifty Investor", handle: "@nifty_investor", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] },
  { id: 30, name: "Crypto Crush", handle: "@crypto_crush", tier: "C", notes: "0 posts, $0.00 total", costPerPost: '', posts: [] }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Creator Platform</h1>
          <ThemeToggle />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 dark:border-indigo-500 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading creators...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-2 mb-6 flex gap-2">
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'roster' ? 'bg-indigo-600 dark:bg-indigo-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Creator Roster
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'requests' ? 'bg-indigo-600 dark:bg-indigo-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Content Requests
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics' ? 'bg-indigo-600 dark:bg-indigo-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Analytics
              </button>
            </div>

            {activeTab === 'roster' && <CreatorRoster creators={creators} setCreators={setCreators} />}
            {activeTab === 'requests' && <ContentRequests creators={creators} />}
            {activeTab === 'analytics' && <Analytics creators={creators} />}
          </>
        )}
      </div>
    </div>
  );
}
