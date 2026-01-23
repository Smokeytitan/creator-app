import { useState, useRef, useMemo } from 'react';
import { Upload, Plus, Trash2, FileText, X, DollarSign, Edit2, Search, Filter, SortAsc, Download, Eye, RefreshCw, Calendar } from 'lucide-react';
import { IMPORTED_CREATORS } from '../data/importedCreators';
import { createCreator, updateCreator, deleteCreator as deleteCreatorSupabase, addPost, updatePost as updatePostSupabase, deletePost as deletePostSupabase } from '../services/creatorsService';

export default function CreatorRoster({ creators, setCreators }) {
  const resetToImportedData = () => {
    if (confirm('This will replace all current creator data with the data from Google Sheets. Are you sure?')) {
      setCreators(IMPORTED_CREATORS);
      alert('Creator data has been reset to imported data from Google Sheets!');
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

  const saveEdit = async (creatorId) => {
    if (!supabase) {
      // Fallback to local state if Supabase not configured
      setCreators(creators.map((c) =>
        c.id === creatorId ? { ...c, ...editForm } : c
      ));
      setEditingId(null);
      setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
      return;
    }

    try {
      const updated = await updateCreator(creatorId, editForm);
      if (updated) {
        setCreators(creators.map((c) =>
          c.id === creatorId ? updated : c
        ));
        setEditingId(null);
        setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
      } else {
        alert('Failed to update creator');
      }
    } catch (error) {
      console.error('Error updating creator:', error);
      alert('Failed to update creator: ' + error.message);
    }
  };

  const saveNew = async () => {
    if (!editForm.name.trim()) {
      alert('Name is required');
      return;
    }

    const newCreatorData = {
      name: editForm.name,
      handle: editForm.handle || '@' + editForm.name.toLowerCase().replace(/\s+/g, '_'),
      notes: editForm.notes,
      costPerPost: editForm.costPerPost,
      platforms: editForm.platforms || []
    };

    if (!supabase) {
      // Fallback to local state if Supabase not configured
      const newCreator = {
        id: Date.now(),
        ...newCreatorData,
        posts: []
      };
      setCreators([...creators, newCreator]);
      setIsAdding(false);
      setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
      return;
    }

    try {
      const created = await createCreator(newCreatorData);
      if (created) {
        setCreators([...creators, created]);
        setIsAdding(false);
        setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
      } else {
        alert('Failed to create creator');
      }
    } catch (error) {
      console.error('Error creating creator:', error);
      alert('Failed to create creator: ' + error.message);
    }
  };

  const deleteCreator = async (creatorId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this creator?')) {
      return;
    }

    if (!supabase) {
      // Fallback to local state if Supabase not configured
      setCreators(creators.filter(c => c.id !== creatorId));
      return;
    }

    try {
      const success = await deleteCreatorSupabase(creatorId);
      if (success) {
        setCreators(creators.filter(c => c.id !== creatorId));
      } else {
        alert('Failed to delete creator');
      }
    } catch (error) {
      console.error('Error deleting creator:', error);
      alert('Failed to delete creator: ' + error.message);
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

  const savePost = async (creatorId, e) => {
    e.stopPropagation();
    if (!postForm.description.trim()) {
      alert('Description is required');
      return;
    }

    const newPostData = {
      description: postForm.description,
      date: postForm.date || new Date().toISOString().split('T')[0],
      cost: postForm.cost,
      link: postForm.link,
      impressions: postForm.impressions,
      platform: 'X' // Default platform
    };

    if (!supabase) {
      // Fallback to local state if Supabase not configured
      const newPost = {
        id: Date.now(),
        ...newPostData
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
      return;
    }

    try {
      const updatedCreator = await addPost(creatorId, newPostData);
      if (updatedCreator) {
        setCreators(creators.map(c =>
          c.id === creatorId ? updatedCreator : c
        ));
        setAddingPostId(null);
        setPostForm({ description: '', date: '', cost: '', link: '', impressions: '' });
      } else {
        alert('Failed to add post');
      }
    } catch (error) {
      console.error('Error adding post:', error);
      alert('Failed to add post: ' + error.message);
    }
  };

  const deletePost = async (creatorId, postId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    if (!supabase) {
      // Fallback to local state if Supabase not configured
      setCreators(creators.map(c => {
        if (c.id === creatorId) {
          return {
            ...c,
            posts: (c.posts || []).filter(p => p.id !== postId)
          };
        }
        return c;
      }));
      return;
    }

    try {
      const success = await deletePostSupabase(postId);
      if (success) {
        setCreators(creators.map(c => {
          if (c.id === creatorId) {
            return {
              ...c,
              posts: (c.posts || []).filter(p => p.id !== postId)
            };
          }
          return c;
        }));
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post: ' + error.message);
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

  const saveEditPost = async (creatorId, postId, e) => {
    e.stopPropagation();
    if (!postForm.description.trim()) {
      alert('Description is required');
      return;
    }

    const postUpdates = {
      description: postForm.description,
      date: postForm.date,
      cost: postForm.cost,
      link: postForm.link,
      impressions: postForm.impressions
    };

    if (!supabase) {
      // Fallback to local state if Supabase not configured
      setCreators(creators.map(c => {
        if (c.id === creatorId) {
          return {
            ...c,
            posts: (c.posts || []).map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  ...postUpdates
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
      return;
    }

    try {
      const success = await updatePostSupabase(postId, postUpdates);
      if (success) {
        setCreators(creators.map(c => {
          if (c.id === creatorId) {
            return {
              ...c,
              posts: (c.posts || []).map(p => {
                if (p.id === postId) {
                  return {
                    ...p,
                    ...postUpdates
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
      } else {
        alert('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post: ' + error.message);
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-polygon-text-primary">Creator Roster</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={startAdd}
            className="inline-flex items-center px-3 sm:px-4 py-2 btn-polygon-primary rounded-polygon-button text-sm shadow-polygon"
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Creator</span>
            <span className="sm:hidden">New</span>
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
            className="inline-flex items-center px-3 sm:px-4 py-2 btn-polygon-primary rounded-polygon-button text-sm shadow-polygon"
          >
            <Upload className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-3 sm:px-4 py-2 btn-polygon-secondary rounded-polygon-button text-sm"
          >
            <Download className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={resetToImportedData}
            className="inline-flex items-center px-3 sm:px-4 py-2 btn-polygon-secondary rounded-polygon-button text-sm border-orange-500/30 hover:border-orange-500/50"
            title="Reset to Google Sheets data"
          >
            <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Reset Data</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="card-polygon rounded-xl shadow p-3 sm:p-4 mb-4 space-y-3 sm:space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or handle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-white/[0.12] rounded-polygon bg-white dark:bg-gray-900 text-polygon-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-polygon-text-secondary" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>

          {/* Activity Filter */}
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="px-3 py-1.5 text-sm border border-white/[0.12] rounded-polygon bg-white dark:bg-gray-900 text-polygon-text-primary"
          >
            <option value="all">All Activity</option>
            <option value="active">Has Posts</option>
            <option value="inactive">No Posts</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-polygon-text-secondary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border border-white/[0.12] rounded-polygon bg-white dark:bg-gray-900 text-polygon-text-primary"
            >
              <option value="name">Sort by Name</option>
              <option value="posts">Sort by Posts</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-polygon hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}

          {/* Results Count */}
          <span className="text-sm text-polygon-text-secondary ml-auto">
            Showing {filteredCreators.length} of {creators.length} creators
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isAdding && (
          <div className="card-polygon rounded-xl shadow p-6 border-2 border-green-500 dark:border-green-400 min-h-[400px]">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-polygon-text-secondary mb-1">Name *</label>
                <input
                  type="text"
                  className="border border-white/[0.12] rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-polygon-text-primary"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Creator name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-polygon-text-secondary mb-1">Handle</label>
                <input
                  type="text"
                  className="border border-white/[0.12] rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-polygon-text-primary"
                  value={editForm.handle}
                  onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-polygon-text-secondary mb-1">Notes</label>
                <input
                  type="text"
                  className="border border-white/[0.12] rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-polygon-text-primary"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-polygon-text-secondary mb-1">Cost Per Post</label>
                <input
                  type="text"
                  className="border border-white/[0.12] rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-polygon-text-primary"
                  value={editForm.costPerPost}
                  onChange={(e) => setEditForm({ ...editForm, costPerPost: e.target.value })}
                  placeholder="e.g., $1,250.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-polygon-text-secondary mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PLATFORMS.map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlatform(platform);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        (editForm.platforms || []).includes(platform)
                          ? 'btn-polygon-primary'
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
                  className="flex-1 px-4 py-2 text-sm btn-polygon-primary rounded "
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
            className="card-polygon rounded-xl shadow p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer min-h-[300px] sm:min-h-[400px] flex flex-col"
            onClick={() => !isAdding && editingId !== c.id && startEdit(c)}
          >
            {editingId === c.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-polygon-text-secondary mb-1">Name</label>
                  <input
                    type="text"
                    className="border border-white/[0.12] rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-polygon-text-primary"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-polygon-text-secondary mb-1">Handle</label>
                  <input
                    type="text"
                    className="border border-white/[0.12] rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-polygon-text-primary"
                    value={editForm.handle}
                    onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-polygon-text-secondary mb-1">Notes</label>
                  <input
                    type="text"
                    className="border border-white/[0.12] rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-polygon-text-primary"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-polygon-text-secondary mb-1">Cost Per Post</label>
                  <input
                    type="text"
                    className="border border-white/[0.12] rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-polygon-text-primary"
                    value={editForm.costPerPost}
                    onChange={(e) => setEditForm({ ...editForm, costPerPost: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="e.g., $1,250.00"
                  />
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <label className="block text-xs font-medium text-polygon-text-secondary mb-2">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_PLATFORMS.map(platform => (
                      <button
                        key={platform}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlatform(platform);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          (editForm.platforms || []).includes(platform)
                            ? 'btn-polygon-primary'
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
                    className="flex-1 px-4 py-2 text-sm btn-polygon-primary rounded "
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
                      <h3 className="text-xl font-semibold text-polygon-text-primary">{c.name}</h3>
                      {(c.platforms || []).length > 0 && (
                        <div className="flex gap-1">
                          {c.platforms.map(platform => (
                            <span
                              key={platform}
                              className="px-2 py-0.5 text-xs font-medium bg-polygon-primary/20 text-polygon-primary-light rounded-full"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-polygon-text-secondary">{c.handle}</p>
                  </div>
                  <button
                    onClick={(e) => deleteCreator(c.id, e)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                    title="Delete creator"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-polygon-text-secondary mb-4">{c.notes}</p>

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
                        <div className="bg-polygon-bg-secondary rounded-polygon p-3">
                          <div className="text-xs text-polygon-text-secondary mb-1">Total Impressions</div>
                          <div className="text-lg font-bold text-polygon-text-primary">
                            {totalImpressions.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-polygon-bg-secondary rounded-polygon p-3">
                          <div className="text-xs text-polygon-text-secondary mb-1">Avg Impressions</div>
                          <div className="text-lg font-bold text-polygon-text-primary">
                            {avgImpressions.toLocaleString()}
                          </div>
                        </div>

                        {totalCost > 0 && (
                          <>
                            <div className="bg-polygon-bg-secondary rounded-polygon p-3">
                              <div className="text-xs text-polygon-text-secondary mb-1">Total Cost</div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>

                            {avgCostPerPost > 0 && (
                              <div className="bg-polygon-bg-secondary rounded-polygon p-3">
                                <div className="text-xs text-polygon-text-secondary mb-1">Avg Cost/Post</div>
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                  ${avgCostPerPost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {cpm > 0 && (
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-polygon p-3 border-2 border-indigo-200 dark:border-indigo-700">
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
                    className="inline-flex items-center px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-polygon font-medium transition-colors w-full justify-center"
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
                      <div className="bg-gray-50 rounded-polygon p-3 space-y-2 border border-indigo-200">
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
                          <div key={post.id} className="bg-gray-50 dark:bg-gray-700 rounded-polygon p-3 text-sm border border-gray-200 dark:border-gray-600">
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
                                  <p className="font-semibold text-polygon-text-primary mb-2">{post.description}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-polygon-text-secondary text-sm">
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
