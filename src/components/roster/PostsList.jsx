import { Plus, Edit2, X, Calendar, DollarSign, Eye } from 'lucide-react';

/**
 * Expandable posts section for a creator card.
 *
 * Renders the add-post form, the list of existing posts (with inline edit),
 * and delete controls.
 */
export default function PostsList({
  creator,
  addingPostId,
  editingPostId,
  postForm,
  setPostForm,
  onStartAddPost,
  onCancelAddPost,
  onSavePost,
  onDeletePost,
  onStartEditPost,
  onCancelEditPost,
  onSaveEditPost,
}) {
  const c = creator;

  return (
    <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Posts</h4>
        <button
          onClick={(e) => onStartAddPost(c.id, e)}
          className="inline-flex items-center px-2 py-1 text-xs bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-lg hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Post
        </button>
      </div>

      {/* Add Post Form */}
      {addingPostId === c.id && (
        <PostForm
          postForm={postForm}
          setPostForm={setPostForm}
          onSave={(e) => onSavePost(c.id, e)}
          onCancel={onCancelAddPost}
          isNew
        />
      )}

      {/* Post List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {(c.posts || []).length === 0 && addingPostId !== c.id ? (
          <p className="text-xs text-[var(--color-text-tertiary)] text-center py-2">No posts yet</p>
        ) : (
          (c.posts || []).map((post) => (
            <div key={post.id} className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 text-sm border border-[var(--color-border)]">
              {editingPostId === post.id ? (
                <PostForm
                  postForm={postForm}
                  setPostForm={setPostForm}
                  onSave={(e) => onSaveEditPost(c.id, post.id, e)}
                  onCancel={onCancelEditPost}
                  isEdit
                />
              ) : (
                <PostDisplay
                  post={post}
                  onEdit={(e) => onStartEditPost(post, e)}
                  onDelete={(e) => onDeletePost(c.id, post.id, e)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Inline form for adding or editing a post.
 */
function PostForm({ postForm, setPostForm, onSave, onCancel, isNew = false, isEdit = false }) {
  const borderClass = isEdit
    ? 'border border-[var(--color-accent-primary)] rounded-lg p-2 bg-[var(--color-bg-primary)]'
    : 'bg-[var(--color-bg-tertiary)] rounded-lg p-3 space-y-2 border border-[var(--color-accent-primary)]';
  const inputBg = isEdit ? 'bg-[var(--color-bg-tertiary)]' : 'bg-[var(--color-bg-primary)]';

  return (
    <div className={`${borderClass} space-y-2`}>
      <input
        type="text"
        placeholder="Description *"
        className={`w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg ${inputBg} text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]`}
        value={postForm.description}
        onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
      />
      <input
        type="date"
        placeholder="Date"
        className={`w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg ${inputBg} text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]`}
        value={postForm.date}
        onChange={(e) => setPostForm({ ...postForm, date: e.target.value })}
      />
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Cost (e.g., 1250.00)"
        className={`w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg ${inputBg} text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]`}
        value={postForm.cost}
        onChange={(e) => setPostForm({ ...postForm, cost: Number(e.target.value) || 0 })}
      />
      <input
        type="number"
        min="0"
        placeholder="Impressions"
        className={`w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg ${inputBg} text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]`}
        value={postForm.impressions}
        onChange={(e) => setPostForm({ ...postForm, impressions: Number(e.target.value) || 0 })}
      />
      <input
        type="url"
        placeholder="Link (optional)"
        className={`w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg ${inputBg} text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]`}
        value={postForm.link}
        onChange={(e) => setPostForm({ ...postForm, link: e.target.value })}
      />
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 px-3 py-1 text-xs bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-lg hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1 text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Single post in display mode.
 */
function PostDisplay({ post, onEdit, onDelete }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <p className="font-semibold text-[var(--color-text-primary)]">{post.description}</p>
          {post.platform && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
              {post.platform}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[var(--color-text-secondary)] text-sm">
          {post.date && (
            <span className="inline-flex items-center text-mono">
              <Calendar className="h-3 w-3 mr-1" />
              {post.date}
            </span>
          )}
          {post.cost && (
            <span className="inline-flex items-center text-mono">
              <DollarSign className="h-3 w-3 mr-0.5" />
              {post.cost}
            </span>
          )}
          {post.impressions && (
            <span className="inline-flex items-center text-mono">
              <Eye className="h-3 w-3 mr-1" />
              {post.impressions} impressions
            </span>
          )}
          {post.likes && (
            <span className="inline-flex items-center text-mono">
              {post.likes} likes
            </span>
          )}
          {post.comments && (
            <span className="inline-flex items-center text-mono">
              {post.comments} comments
            </span>
          )}
        </div>
        {post.link && (
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] font-medium mt-2 text-sm hover:underline"
          >
            View Post {post.platform ? `on ${post.platform}` : ''} &rarr;
          </a>
        )}
      </div>
      <div className="flex gap-1">
        <button
          onClick={onEdit}
          className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)] rounded"
          title="Edit post"
        >
          <Edit2 className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-[var(--color-text-tertiary)] hover:text-red-400 rounded"
          title="Delete post"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
