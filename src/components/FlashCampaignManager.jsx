import { useState } from 'react';
import { BarChart3, Zap } from 'lucide-react';
import KaitoEditorial from './KaitoEditorial';
import FlashCampaignDashboard from './FlashCampaignDashboard';

const FlashCampaignManager = () => {
  const [activeSubTab, setActiveSubTab] = useState('leaderboard'); // 'leaderboard' | 'campaigns'

  return (
    <div className="h-full">
      {/* Sub-Tab Navigation */}
      <div className="mb-8">
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveSubTab('leaderboard')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeSubTab === 'leaderboard'
                ? 'text-[var(--color-accent-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Kaito Leaderboard
            </span>
            {activeSubTab === 'leaderboard' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)]" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('campaigns')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeSubTab === 'campaigns'
                ? 'text-[var(--color-accent-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Flash Campaigns
            </span>
            {activeSubTab === 'campaigns' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeSubTab === 'leaderboard' && <KaitoEditorial />}
        {activeSubTab === 'campaigns' && <FlashCampaignDashboard />}
      </div>
    </div>
  );
};

export default FlashCampaignManager;
