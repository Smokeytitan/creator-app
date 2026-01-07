import { useState, useRef } from 'react';
import { Upload, Plus, Trash2, FileText, X, DollarSign, Edit2 } from 'lucide-react';

export default function CreatorRoster({ creators, setCreators }) {
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', handle: '', tier: 'C', notes: '', costPerPost: '' });
  const [viewingPostsId, setViewingPostsId] = useState(null);
  const [addingPostId, setAddingPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postForm, setPostForm] = useState({ description: '', date: '', cost: '', link: '', impressions: '' });
  const fileInputRef = useRef(null);

  const startEdit = (creator) => {
    setEditingId(creator.id);
    setIsAdding(false);
    setEditForm({
      name: creator.name,
      handle: creator.handle,
      tier: creator.tier,
      notes: creator.notes || '',
      costPerPost: creator.costPerPost || ''
    });
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditForm({ name: '', handle: '', tier: 'C', notes: '', costPerPost: '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setEditForm({ name: '', handle: '', tier: 'C', notes: '', costPerPost: '' });
  };

  const saveEdit = (creatorId) => {
    setCreators(creators.map((c) =>
      c.id === creatorId ? { ...c, ...editForm } : c
    ));
    setEditingId(null);
    setEditForm({ name: '', handle: '', tier: 'C', notes: '', costPerPost: '' });
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
      tier: editForm.tier,
      notes: editForm.notes,
      costPerPost: editForm.costPerPost,
      posts: []
    };

    setCreators([...creators, newCreator]);
    setIsAdding(false);
    setEditForm({ name: '', handle: '', tier: 'C', notes: '', costPerPost: '' });
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
    const tierIdx = headers.findIndex(h => h.includes('tier'));
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
        tier: tierIdx >= 0 ? values[tierIdx] : 'C',
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isAdding && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border-2 border-green-500 dark:border-green-400">
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
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tier</label>
                <select
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                  value={editForm.tier}
                  onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
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
        {creators.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
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
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tier</label>
                  <select
                    className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                    value={editForm.tier}
                    onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
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
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                    <p className="text-sm text-gray-500">{c.handle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-sm font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                      Tier {c.tier}
                    </span>
                    <button
                      onClick={(e) => deleteCreator(c.id, e)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete creator"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{c.notes}</p>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => toggleViewPosts(c.id, e)}
                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {(c.posts || []).length} Posts
                  </button>
                </div>

                {viewingPostsId === c.id && (
                  <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700">Posts</h4>
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

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(c.posts || []).length === 0 && addingPostId !== c.id ? (
                        <p className="text-xs text-gray-400 text-center py-2">No posts yet</p>
                      ) : (
                        (c.posts || []).map((post) => (
                          <div key={post.id} className="bg-gray-50 rounded p-2 text-xs">
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
                                  <p className="font-medium text-gray-900">{post.description}</p>
                                  <div className="flex items-center gap-3 mt-1 text-gray-500">
                                    {post.date && <span>{post.date}</span>}
                                    {post.cost && (
                                      <span className="inline-flex items-center">
                                        <DollarSign className="h-3 w-3 mr-0.5" />
                                        {post.cost}
                                      </span>
                                    )}
                                    {post.impressions && <span>{post.impressions} imp</span>}
                                  </div>
                                  {post.link && (
                                    <a
                                      href={post.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:underline mt-1 inline-block"
                                    >
                                      View Post
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

                <p className="text-xs text-gray-400 mt-3">Click to edit</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
