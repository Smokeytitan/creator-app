import { useState, useMemo, useRef } from 'react';
import { Download, ExternalLink, RefreshCw, Eye, TrendingUp, Users, Calendar, Award, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { fetchCampaignResults, getExcludedAccounts, mergeTweetsWithResults } from '../services/flashCampaignServiceSupabase';
import { parseFlashCampaignExcel, processTweetsForCampaign } from '../services/flashCampaignExcelService';

const CampaignResultsView = ({ campaign, onResultsUpdated }) => {
  const [isRefetching, setIsRefetching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'creatorRank', direction: 'asc' });
  const fileInputRef = useRef(null);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!campaign.results) return null;

    const { eligibleTweets } = campaign.results;
    const uniqueCreators = new Set(eligibleTweets.map(t => t.creatorHandle)).size;
    const totalImpressions = eligibleTweets.reduce((sum, t) => sum + t.totalImpressions, 0);

    return {
      totalTweets: eligibleTweets.length,
      uniqueCreators,
      totalImpressions
    };
  }, [campaign.results]);

  // Sort tweets
  const sortedTweets = useMemo(() => {
    if (!campaign.results) return [];

    const tweets = [...campaign.results.eligibleTweets];

    tweets.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle numeric sorting
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle string sorting
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return tweets;
  }, [campaign.results, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRefetch = async () => {
    setIsRefetching(true);
    try {
      await fetchCampaignResults(campaign.id);
      if (onResultsUpdated) {
        onResultsUpdated();
      }
    } catch (error) {
      console.error('Error refetching results:', error);
      alert('Failed to refetch results. Please try again.');
    } finally {
      setIsRefetching(false);
    }
  };

  const handleUploadExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setIsUploading(true);

    try {
      console.log('Parsing Excel file...');
      // Parse Excel file
      const tweetsData = await parseFlashCampaignExcel(file);
      console.log(`Parsed ${tweetsData.length} tweets from Excel`);

      // Process tweets (fetch from Twitter, translate, match against key phrases)
      console.log('Processing tweets...');
      const processResult = await processTweetsForCampaign(
        campaign.id,
        tweetsData,
        campaign.results,
        campaign.keyPhrases
      );

      if (processResult.error) {
        alert(`Upload failed: ${processResult.message}`);
        return;
      }

      if (processResult.newTweets.length === 0) {
        alert(processResult.message || 'No new tweets to add');
        return;
      }

      // Merge with existing results
      console.log(`Merging ${processResult.newTweets.length} new tweets with existing results...`);
      await mergeTweetsWithResults(campaign.id, processResult.newTweets, campaign.results);

      // Show success message
      let message = `Successfully uploaded ${processResult.newTweets.length} tweet(s)`;
      if (processResult.duplicateCount > 0) {
        message += `\n${processResult.duplicateCount} duplicate(s) skipped`;
      }
      if (processResult.skippedCount > 0) {
        message += `\n${processResult.skippedCount} tweet(s) didn't match key phrases`;
      }
      alert(message);

      // Refresh UI
      if (onResultsUpdated) {
        onResultsUpdated();
      }
    } catch (error) {
      console.error('Error uploading tweets:', error);
      alert(`Failed to upload tweets: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportCSV = async () => {
    const excludedAccounts = await getExcludedAccounts();
    const excludedHandles = excludedAccounts.map(a => `@${a.handle}`).join(', ');

    // Format dates in EST
    const formatDateEST = (dateStr) => {
      return new Date(dateStr).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) + ' EST';
    };

    // Build CSV header
    let csv = 'FLASH CAMPAIGN RESULTS\n';
    csv += `Campaign: ${campaign.name}\n`;
    csv += `Date Range: ${formatDateEST(campaign.startDateTime)} - ${formatDateEST(campaign.endDateTime)}\n`;
    csv += `Key Phrases: ${campaign.keyPhrases.join(', ')}\n`;
    csv += `Reward Pool: ${campaign.rewardPool || 'N/A'}\n`;
    csv += `Fetched: ${formatDateEST(campaign.results.fetchedAt)}\n`;
    csv += `Total Eligible Tweets: ${campaign.results.eligibleTweets.length}\n`;
    csv += `Excluded Accounts: ${excludedHandles || 'None'}\n\n`;

    // Column headers
    csv += 'Creator Name,Handle,Rank,Tweet URL,Impressions,Likes,Retweets,Quotes,Bookmarks,Engagement Rate,Matched Phrase,Tweet Preview\n';

    // Data rows
    campaign.results.eligibleTweets.forEach(tweet => {
      const tweetPreview = tweet.tweetText ? tweet.tweetText.replace(/"/g, '""') : 'N/A';
      csv += `"${tweet.creatorName}","${tweet.creatorHandle}",${tweet.creatorRank},"${tweet.tweetUrl}",${tweet.totalImpressions},${tweet.totalLikes},${tweet.totalRetweets},${tweet.totalQuotes},${tweet.totalBookmarks},"${tweet.engagementRate}","${tweet.matchedPhrase}","${tweetPreview}"\n`;
    });

    // Download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `flash_campaign_${campaign.name.replace(/\s+/g, '_')}_${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/30">
          <Award className="w-3 h-3" />
          <span className="text-xs font-bold">#1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-400/10 text-gray-400 rounded-full border border-gray-400/30">
          <Award className="w-3 h-3" />
          <span className="text-xs font-bold">#2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-orange-600/10 text-orange-600 rounded-full border border-orange-600/30">
          <Award className="w-3 h-3" />
          <span className="text-xs font-bold">#3</span>
        </div>
      );
    }
    return (
      <div className="px-2 py-1 bg-white/5 text-[var(--color-text-secondary)] rounded-full border border-white/10">
        <span className="text-xs font-mono">#{rank}</span>
      </div>
    );
  };

  if (!campaign.results) {
    return (
      <div className="card-editorial text-center py-12">
        <RefreshCw className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
        <p className="text-[var(--color-text-secondary)]">
          No results available yet
        </p>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
          Results will be fetched automatically when the campaign ends
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Info Card */}
      <div className="card-editorial">
        <h3 className="text-display text-xl mb-4">{campaign.name}</h3>

        {campaign.description && (
          <p className="text-[var(--color-text-secondary)] mb-4">{campaign.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--color-accent-primary)]/10 rounded-lg">
              <Calendar className="w-4 h-4 text-[var(--color-accent-primary)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Date Range (EST)</p>
              <p className="text-sm font-medium text-mono">
                {new Date(campaign.startDateTime).toLocaleDateString('en-US', { timeZone: 'America/New_York' })} - {new Date(campaign.endDateTime).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-400/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Key Phrases</p>
              <p className="text-sm font-medium">{campaign.keyPhrases.length}</p>
            </div>
          </div>

          {campaign.rewardPool && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-400/10 rounded-lg">
                <Award className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">Reward Pool</p>
                <p className="text-sm font-medium">{campaign.rewardPool}</p>
              </div>
            </div>
          )}
        </div>

        {/* Key Phrases Display */}
        <div className="mt-4">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Required Phrases:</p>
          <div className="flex flex-wrap gap-2">
            {campaign.keyPhrases.map((phrase, idx) => (
              <span
                key={idx}
                className="px-3 py-1 text-sm bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-full border border-[var(--color-accent-primary)]/30"
              >
                {phrase}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-editorial accent-border-left">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-accent-primary)]/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-[var(--color-accent-primary)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Eligible Tweets</p>
              <p className="text-2xl font-bold metric-value text-[var(--color-accent-primary)]">
                {summaryMetrics.totalTweets.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card-editorial">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-400/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Unique Creators</p>
              <p className="text-2xl font-bold metric-value text-blue-400">
                {summaryMetrics.uniqueCreators}
              </p>
            </div>
          </div>
        </div>

        <div className="card-editorial">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-400/10 rounded-lg">
              <Eye className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Total Impressions</p>
              <p className="text-2xl font-bold metric-value text-purple-400">
                {summaryMetrics.totalImpressions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleRefetch}
          className="btn-editorial-secondary flex items-center gap-2"
          disabled={isRefetching}
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          {isRefetching ? 'Refetching...' : 'Refetch Results'}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-editorial-secondary flex items-center gap-2"
          disabled={isUploading}
        >
          <Upload className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''}`} />
          {isUploading ? 'Uploading...' : 'Upload Tweets'}
        </button>
        <button
          onClick={handleExportCSV}
          className="btn-editorial-primary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleUploadExcel}
          style={{ display: 'none' }}
        />
      </div>

      {/* Twitter API Status Banner */}
      {campaign.results.twitterApiUsed ? (
        <div className="card-editorial bg-green-500/5 border-green-500/30">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-500 mb-1">Automatic Phrase Matching Enabled</p>
              <p className="text-green-500/80 text-xs">
                Tweet content was fetched from Twitter API and automatically matched against your key phrases. Only tweets containing the required phrases are shown below.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-editorial bg-yellow-500/5 border-yellow-500/30">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-500 mb-1">Manual Verification Required</p>
              <p className="text-yellow-500/80 text-xs">
                Twitter API was unavailable during results fetching. Click "View Tweet" links to manually verify that each tweet contains the required key phrases.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="card-editorial overflow-hidden">
        <h4 className="text-lg font-bold mb-4">
          Eligible Tweets (Top 115 Creators Only)
          {campaign.results.twitterApiUsed && (
            <span className="ml-2 text-xs text-green-500 font-normal">
              • Phrase-matched
            </span>
          )}
        </h4>

        {sortedTweets.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
            <p className="text-[var(--color-text-secondary)]">
              No eligible tweets found
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
              Try adjusting the campaign date range or check excluded accounts
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th
                    className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-primary)]"
                    onClick={() => handleSort('creatorRank')}
                  >
                    Rank {sortConfig.key === 'creatorRank' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-primary)]"
                    onClick={() => handleSort('creatorName')}
                  >
                    Creator {sortConfig.key === 'creatorName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-tertiary)]">
                    Tweet
                  </th>
                  {campaign.results.twitterApiUsed && (
                    <th
                      className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-primary)]"
                      onClick={() => handleSort('matchedPhrase')}
                    >
                      Matched Phrase {sortConfig.key === 'matchedPhrase' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  <th
                    className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-primary)]"
                    onClick={() => handleSort('totalImpressions')}
                  >
                    Impressions {sortConfig.key === 'totalImpressions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-primary)]"
                    onClick={() => handleSort('engagementRate')}
                  >
                    Engagement {sortConfig.key === 'engagementRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTweets.map((tweet, index) => (
                  <tr
                    key={`${tweet.creatorHandle}-${index}`}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    style={{
                      animation: 'fadeInUp 0.4s ease-out forwards',
                      animationDelay: `${index * 0.02}s`,
                      opacity: 0
                    }}
                  >
                    <td className="py-3 px-4">
                      {getRankBadge(tweet.creatorRank)}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-sm">{tweet.creatorName}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">{tweet.creatorHandle}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <a
                          href={tweet.tweetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] transition-colors"
                        >
                          <span>View Tweet</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {tweet.tweetText && (
                          <p className="text-xs text-[var(--color-text-tertiary)] italic max-w-xs truncate" title={tweet.tweetText}>
                            "{tweet.tweetText}"
                          </p>
                        )}
                      </div>
                    </td>
                    {campaign.results.twitterApiUsed && (
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded-full border border-green-500/30">
                          {tweet.matchedPhrase}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className="text-mono text-sm">
                        {tweet.totalImpressions.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-mono text-sm">
                        {tweet.engagementRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignResultsView;
