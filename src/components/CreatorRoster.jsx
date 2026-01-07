import { useState, useRef, useMemo } from 'react';
import { Upload, Plus, Trash2, FileText, X, DollarSign, Edit2, Search, Filter, SortAsc, Download, Eye, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import { IMPORTED_CREATORS } from '../data/importedCreators';
import { KaitoService } from '../services/kaitoService';

export default function CreatorRoster({ creators, setCreators }) {
  const [enrichingKaito, setEnrichingKaito] = useState(false);
  const [kaitoStartDate, setKaitoStartDate] = useState('2025-12-01');
  const [kaitoEndDate, setKaitoEndDate] = useState('2025-12-31');

  const resetToImportedData = () => {
    if (confirm('This will replace all current creator data with the data from Google Sheets. Are you sure?')) {
      setCreators(IMPORTED_CREATORS);
      alert('Creator data has been reset to imported data from Google Sheets!');
    }
  };

  const enrichWithKaitoData = async () => {
    setEnrichingKaito(true);
    try {
      const kaitoService = new KaitoService();
      console.log(`Fetching Kaito data for date range: ${kaitoStartDate} to ${kaitoEndDate}`);

      const leaderboardData = await kaitoService.fetchLeaderboard({
        start_date: kaitoStartDate,
        end_date: kaitoEndDate
      });

      console.log(`Received ${leaderboardData.length} creators from Kaito`);

      let matchedCount = 0;
      const enrichedCreators = creators.map(creator => {
        // Extract username from handle (remove @ symbol)
        const creatorUsername = creator.handle?.toLowerCase().replace('@', '').trim();

        if (!creatorUsername) return creator;

        // Find matching Kaito data by username
        const kaitoData = leaderboardData.find(
          member => member.username?.toLowerCase() === creatorUsername
        );

        if (kaitoData) {
          matchedCount++;
          console.log(`✓ Matched: ${creator.name} (@${creatorUsername}) - Rank #${kaitoData.rank}`);

          return {
            ...creator,
            kaitoMetrics: {
              rank: parseInt(kaitoData.rank) || null,
              mindshare: kaitoData.mindshare || 0,
              totalImpressions: kaitoData.total_impressions || 0,
              totalEngagement: (kaitoData.total_retweets || 0) +
                             (kaitoData.total_likes || 0) +
                             (kaitoData.total_bookmarks || 0),
              tweetCount: kaitoData.tweet_counts || 0,
              smartFollowers: kaitoData.smart_followers || 0,
              userLevel: kaitoData.user_level || null,
              lastUpdated: new Date().toISOString(),
              dateRange: `${kaitoStartDate} to ${kaitoEndDate}`
            }
          };
        }

        return creator;
      });

      setCreators(enrichedCreators);
      alert(`Successfully enriched ${matchedCount} out of ${creators.length} creators with Kaito data!\n\nDate range: ${kaitoStartDate} to ${kaitoEndDate}`);
    } catch (error) {
      console.error('Failed to enrich with Kaito data:', error);
      alert(`Failed to fetch Kaito data: ${error.message}`);
    } finally {
      setEnrichingKaito(false);
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
  const [viewingPostsId, setViewingPostsId] = useState(null);
  const [addingPostId, setAddingPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postForm, setPostForm] = useState({ description: '', date: '', cost: '', link: '', impressions: '' });
  const fileInputRef = useRef(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivity, setFilterActivity] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const AVAILABLE_PLATFORMS = ['X', 'TikTok', 'Instagram', 'YouTube'];

  const togglePlatform = (platform) => {
    const platforms = editForm.platforms || [];
    if (platforms.includes(platform)) {
      setEditForm({ ...editForm, platforms: platforms.filter(p => p !== platform) });
    } else {
      setEditForm({ ...editForm, platforms: [...platforms, platform] });
    }
  };

  const startEdit = (creator) => {
    setEditingId(creator.id);
    setIsAdding(false);
    setEditForm({
      name: creator.name,
      handle: creator.handle,
      notes: creator.notes || '',
      costPerPost: creator.costPerPost || '',
      platforms: creator.platforms || []
    });
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
  };

  const saveEdit = (creatorId) => {
    setCreators(creators.map((c) =>
      c.id === creatorId ? { ...c, ...editForm } : c
    ));
    setEditingId(null);
    setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
  };

  const saveNew = () => {
    if (!editForm.name.trim()) {
      alert('Name is required');
      return;
    }

    const newCreator = {
      id: Date.now(),
      name: editForm.name,
      handle: editForm.handle || '@' + editForm.name.toLowerCase().replace(/\s+/g, '_'),
      notes: editForm.notes,
      costPerPost: editForm.costPerPost,
      platforms: editForm.platforms || [],
      posts: []
    };

    setCreators([...creators, newCreator]);
    setIsAdding(false);
    setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
  };

  const deleteCreator = (creatorId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this creator?')) {
      setCreators(creators.filter(c => c.id !== creatorId));
    }
  };

  const toggleViewPosts = (creatorId, e) => {
    e.stopPropagation();
    setViewingPostsId(viewingPostsId === creatorId ? null : creatorId);
    setAddingPostId(null);
  };

  const startAddPost = (creatorId, e) => {
    e.stopPropagation();
    const creator = creators.find(c => c.id === creatorId);
    setAddingPostId(creatorId);
    setPostForm({
      description: '',
      date: new Date().toISOString().split('T')[0],
      cost: creator?.costPerPost || '',
      link: '',
      impressions: ''
    });
  };

  const cancelAddPost = (e) => {
    e.stopPropagation();
    setAddingPostId(null);
    setPostForm({ description: '', date: '', cost: '', link: '', impressions: '' });
  };

  const savePost = (creatorId, e) => {
    e.stopPropagation();
    if (!postForm.description.trim()) {
      alert('Description is required');
      return;
    }

    const newPost = {
      id: Date.now(),
      description: postForm.description,
      date: postForm.date || new Date().toISOString().split('T')[0],
      cost: postForm.cost,
      link: postForm.link,
      impressions: postForm.impressions
    };

    setCreators(creators.map(c => {
      if (c.id === creatorId) {
        return {
          ...c,
          posts: [...(c.posts || []), newPost]
        };
      }
      return c;
    }));

    setAddingPostId(null);
    setPostForm({ description: '', date: '', cost: '', link: '', impressions: '' });
  };

  const deletePost = (creatorId, postId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this post?')) {
      setCreators(creators.map(c => {
        if (c.id === creatorId) {
          return {
            ...c,
            posts: (c.posts || []).filter(p => p.id !== postId)
          };
        }
        return c;
      }));
    }
  };

  const startEditPost = (post, e) => {
    e.stopPropagation();
    setEditingPostId(post.id);
    setAddingPostId(null);
    setPostForm({
      description: post.description,
      date: post.date,
      cost: post.cost,
      link: post.link || '',
      impressions: post.impressions || ''
    });
  };

  const cancelEditPost = (e) => {
    e.stopPropagation();
    setEditingPostId(null);
    setPostForm({ description: '', date: '', cost: '', link: '', impressions: '' });
  };

  const saveEditPost = (creatorId, postId, e) => {
    e.stopPropagation();
    if (!postForm.description.trim()) {
      alert('Description is required');
      return;
    }

    setCreators(creators.map(c => {
      if (c.id === creatorId) {
        return {
          ...c,
          posts: (c.posts || []).map(p => {
            if (p.id === postId) {
              return {
                ...p,
                description: postForm.description,
                date: postForm.date,
                cost: postForm.cost,
                link: postForm.link,
                impressions: postForm.impressions
              };
            }
            return p;
          })
        };
      }
      return c;
    }));

    setEditingPostId(null);
    setPostForm({ description: '', date: '', cost: '', link: '', impressions: '' });
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Get headers (first row)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Find column indices
    const nameIdx = headers.findIndex(h => h.includes('name'));
    const handleIdx = headers.findIndex(h => h.includes('handle') || h.includes('twitter') || h.includes('username'));
    const notesIdx = headers.findIndex(h => h.includes('note'));
    const costPerPostIdx = headers.findIndex(h => h.includes('cost') && h.includes('post'));

    // Parse data rows
    const creators = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      const creator = {
        id: Date.now() + i,
        name: nameIdx >= 0 ? values[nameIdx] : '',
        handle: handleIdx >= 0 ? values[handleIdx] : '',
        notes: notesIdx >= 0 ? values[notesIdx] : '',
        costPerPost: costPerPostIdx >= 0 ? values[costPerPostIdx] : '',
        posts: []
      };

      // Only add if we have at least a name
      if (creator.name) {
        creators.push(creator);
      }
    }

    return creators;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const importedCreators = parseCSV(text);

        if (importedCreators.length > 0) {
          setCreators(importedCreators);
          alert(`Successfully imported ${importedCreators.length} creators!`);
        } else {
          alert('No valid creator data found in CSV file.');
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };

    reader.readAsText(file);

    // Reset input so the same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportToCSV = () => {
    // Use filtered creators for export
    const dataToExport = filteredCreators.length > 0 ? filteredCreators : creators;

    // Prepare CSV data
    const csvRows = dataToExport.map(creator => {
      const posts = creator.posts || [];
      const totalPosts = posts.length;

      // Calculate total spend
      let totalSpend = 0;
      posts.forEach(post => {
        if (post.cost) {
          const cost = parseFloat(post.cost.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(cost)) {
            totalSpend += cost;
          }
        }
      });

      return {
        'Name': creator.name,
        'Handle': creator.handle,
        'Cost Per Post': creator.costPerPost || '',
        'Total Posts': totalPosts,
        'Total Spend': totalSpend > 0 ? `$${totalSpend.toFixed(2)}` : '$0.00',
        'Notes': creator.notes || ''
      };
    });

    // Convert to CSV
    let csv = 'CREATOR ROSTER\n';

    // Add filter info
    if (searchTerm) {
      csv += `Search: "${searchTerm}"\n`;
    }
    if (filterActivity !== 'all') {
      csv += `Filter: ${filterActivity === 'active' ? 'Has Posts' : 'No Posts'}\n`;
    }
    if (sortBy !== 'name') {
      csv += `Sort: ${sortBy === 'posts' ? 'By Posts' : 'By Name'}\n`;
    }
    csv += `\nTotal Creators: ${dataToExport.length}\n\n`;

    // Add headers
    const headers = Object.keys(csvRows[0] || {});
    csv += headers.join(',') + '\n';

    // Add data rows
    csvRows.forEach(row => {
      csv += headers.map(header => `"${row[header]}"`).join(',') + '\n';
    });

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `creator_roster_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort creators
  const filteredCreators = useMemo(() => {
    let filtered = [...creators];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.handle.toLowerCase().includes(search)
      );
    }

    // Activity filter
    if (filterActivity !== 'all') {
      if (filterActivity === 'active') {
        filtered = filtered.filter(c => (c.posts || []).length > 0);
      } else if (filterActivity === 'inactive') {
        filtered = filtered.filter(c => (c.posts || []).length === 0);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'posts':
          return ((b.posts || []).length) - ((a.posts || []).length);
        default:
          return 0;
      }
    });

    return filtered;
  }, [creators, searchTerm, filterActivity, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterActivity('all');
    setSortBy('name');
  };

  const hasActiveFilters = searchTerm || filterActivity !== 'all' || sortBy !== 'name';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Creator Roster</h2>
        <div className="flex gap-2">
          <button
            onClick={startAdd}
            className="inline-flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Creator
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={resetToImportedData}
            className="inline-flex items-center px-4 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
            title="Reset to Google Sheets data"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Data
          </button>
        </div>
      </div>

      {/* Kaito Data Enrichment Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={kaitoStartDate}
              onChange={(e) => setKaitoStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={kaitoEndDate}
              onChange={(e) => setKaitoEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
            />
          </div>
          <button
            onClick={enrichWithKaitoData}
            disabled={enrichingKaito}
            className="inline-flex items-center px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Match creators with Kaito leaderboard data"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {enrichingKaito ? 'Enriching...' : 'Enrich with Kaito Data'}
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or handle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>

          {/* Activity Filter */}
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
          >
            <option value="all">All Activity</option>
            <option value="active">Has Posts</option>
            <option value="inactive">No Posts</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
            >
              <option value="name">Sort by Name</option>
              <option value="posts">Sort by Posts</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}

          {/* Results Count */}
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            Showing {filteredCreators.length} of {creators.length} creators
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isAdding && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border-2 border-green-500 dark:border-green-400 min-h-[400px]">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name *</label>
                <input
                  type="text"
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Creator name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Handle</label>
                <input
                  type="text"
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                  value={editForm.handle}
                  onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
                <input
                  type="text"
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cost Per Post</label>
                <input
                  type="text"
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                  value={editForm.costPerPost}
                  onChange={(e) => setEditForm({ ...editForm, costPerPost: e.target.value })}
                  placeholder="e.g., $1,250.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PLATFORMS.map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        (editForm.platforms || []).includes(platform)
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  className="flex-1 px-4 py-2 text-sm bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600"
                  onClick={saveNew}
                >
                  Create
                </button>
                <button
                  className="flex-1 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {filteredCreators.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer min-h-[400px] flex flex-col"
            onClick={() => !isAdding && editingId !== c.id && startEdit(c)}
          >
            {editingId === c.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Handle</label>
                  <input
                    type="text"
                    className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                    value={editForm.handle}
                    onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
                  <input
                    type="text"
                    className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cost Per Post</label>
                  <input
                    type="text"
                    className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                    value={editForm.costPerPost}
                    onChange={(e) => setEditForm({ ...editForm, costPerPost: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="e.g., $1,250.00"
                  />
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_PLATFORMS.map(platform => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          (editForm.platforms || []).includes(platform)
                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="flex-1 px-4 py-2 text-sm bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600"
                    onClick={() => saveEdit(c.id)}
                  >
                    Save
                  </button>
                  <button
                    className="flex-1 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{c.name}</h3>
                      {(c.platforms || []).length > 0 && (
                        <div className="flex gap-1">
                          {c.platforms.map(platform => (
                            <span
                              key={platform}
                              className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{c.handle}</p>
                  </div>
                  <button
                    onClick={(e) => deleteCreator(c.id, e)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                    title="Delete creator"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{c.notes}</p>

                {/* Kaito Metrics */}
                {c.kaitoMetrics && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">Kaito Leaderboard</span>
                      {c.kaitoMetrics.rank && (
                        <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-purple-600 dark:bg-purple-500 text-white rounded-full">
                          #{c.kaitoMetrics.rank}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {c.kaitoMetrics.totalImpressions > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Impressions:</span>
                          <span className="ml-1 font-semibold text-gray-900 dark:text-gray-50">
                            {c.kaitoMetrics.totalImpressions.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {c.kaitoMetrics.totalEngagement > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Engagement:</span>
                          <span className="ml-1 font-semibold text-gray-900 dark:text-gray-50">
                            {c.kaitoMetrics.totalEngagement.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {c.kaitoMetrics.smartFollowers > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Smart Followers:</span>
                          <span className="ml-1 font-semibold text-gray-900 dark:text-gray-50">
                            {c.kaitoMetrics.smartFollowers.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {c.kaitoMetrics.tweetCount > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Tweets:</span>
                          <span className="ml-1 font-semibold text-gray-900 dark:text-gray-50">
                            {c.kaitoMetrics.tweetCount}
                          </span>
                        </div>
                      )}
                    </div>
                    {c.kaitoMetrics.dateRange && (
                      <div className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                        {c.kaitoMetrics.dateRange}
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                {(c.posts || []).length > 0 && (() => {
                  const posts = c.posts || [];
                  let totalImpressions = 0;
                  let totalCost = 0;

                  posts.forEach(post => {
                    if (post.impressions) {
                      const impressions = parseFloat(post.impressions.replace(/[^0-9.-]+/g, ''));
                      if (!isNaN(impressions)) {
                        totalImpressions += impressions;
                      }
                    }
                    if (post.cost) {
                      const cost = parseFloat(post.cost.replace(/[^0-9.-]+/g, ''));
                      if (!isNaN(cost)) {
                        totalCost += cost;
                      }
                    }
                  });

                  const avgImpressions = posts.length > 0 ? Math.round(totalImpressions / posts.length) : 0;
                  const cpm = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;
                  const avgCostPerPost = posts.length > 0 && totalCost > 0 ? totalCost / posts.length : 0;

                  return (
                    <div className="space-y-3 mb-4">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Impressions</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-50">
                            {totalImpressions.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Impressions</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-50">
                            {avgImpressions.toLocaleString()}
                          </div>
                        </div>

                        {totalCost > 0 && (
                          <>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Cost</div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>

                            {avgCostPerPost > 0 && (
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Cost/Post</div>
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                  ${avgCostPerPost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {cpm > 0 && (
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border-2 border-indigo-200 dark:border-indigo-700">
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">CPM (Cost/1K)</div>
                            <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                              ${cpm.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex-grow"></div>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={(e) => toggleViewPosts(c.id, e)}
                    className="inline-flex items-center px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg font-medium transition-colors w-full justify-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {viewingPostsId === c.id ? 'Hide' : 'View'} {(c.posts || []).length} Post{(c.posts || []).length !== 1 ? 's' : ''}
                  </button>
                </div>

                {viewingPostsId === c.id && (
                  <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Posts</h4>
                      <button
                        onClick={(e) => startAddPost(c.id, e)}
                        className="inline-flex items-center px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Post
                      </button>
                    </div>

                    {addingPostId === c.id && (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-indigo-200">
                        <input
                          type="text"
                          placeholder="Description *"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          value={postForm.description}
                          onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                        />
                        <input
                          type="date"
                          placeholder="Date"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          value={postForm.date}
                          onChange={(e) => setPostForm({ ...postForm, date: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Cost (e.g., $1,250.00)"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          value={postForm.cost}
                          onChange={(e) => setPostForm({ ...postForm, cost: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Impressions"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          value={postForm.impressions}
                          onChange={(e) => setPostForm({ ...postForm, impressions: e.target.value })}
                        />
                        <input
                          type="url"
                          placeholder="Link (optional)"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          value={postForm.link}
                          onChange={(e) => setPostForm({ ...postForm, link: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => savePost(c.id, e)}
                            className="flex-1 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelAddPost}
                            className="flex-1 px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(c.posts || []).length === 0 && addingPostId !== c.id ? (
                        <p className="text-xs text-gray-400 text-center py-2">No posts yet</p>
                      ) : (
                        (c.posts || []).map((post) => (
                          <div key={post.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
                            {editingPostId === post.id ? (
                              <div className="space-y-2 border border-indigo-200 rounded p-2 bg-white">
                                <input
                                  type="text"
                                  placeholder="Description *"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  value={postForm.description}
                                  onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                                />
                                <input
                                  type="date"
                                  placeholder="Date"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  value={postForm.date}
                                  onChange={(e) => setPostForm({ ...postForm, date: e.target.value })}
                                />
                                <input
                                  type="text"
                                  placeholder="Cost (e.g., $1,250.00)"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  value={postForm.cost}
                                  onChange={(e) => setPostForm({ ...postForm, cost: e.target.value })}
                                />
                                <input
                                  type="text"
                                  placeholder="Impressions"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  value={postForm.impressions}
                                  onChange={(e) => setPostForm({ ...postForm, impressions: e.target.value })}
                                />
                                <input
                                  type="url"
                                  placeholder="Link (optional)"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  value={postForm.link}
                                  onChange={(e) => setPostForm({ ...postForm, link: e.target.value })}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => saveEditPost(c.id, post.id, e)}
                                    className="flex-1 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditPost}
                                    className="flex-1 px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-gray-50 mb-2">{post.description}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                                    {post.date && (
                                      <span className="inline-flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {post.date}
                                      </span>
                                    )}
                                    {post.cost && (
                                      <span className="inline-flex items-center">
                                        <DollarSign className="h-3 w-3 mr-0.5" />
                                        {post.cost}
                                      </span>
                                    )}
                                    {post.impressions && (
                                      <span className="inline-flex items-center">
                                        <Eye className="h-3 w-3 mr-1" />
                                        {post.impressions} impressions
                                      </span>
                                    )}
                                  </div>
                                  {post.link && (
                                    <a
                                      href={post.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mt-2 text-sm hover:underline"
                                    >
                                      View Post on X →
                                    </a>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => startEditPost(post, e)}
                                    className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                                    title="Edit post"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => deletePost(c.id, post.id, e)}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    title="Delete post"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
