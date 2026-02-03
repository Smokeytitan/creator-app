import { Plus, Trash2, Edit2, Eye } from 'lucide-react';
import PostForm from './PostForm';

/**
 * PostList - Display and manage posts for a creator
 * @param {Object} props
 * @param {Array} props.posts - Array of posts
 * @param {number} props.creatorId - ID of the creator
 * @param {boolean} props.isAddingPost - Whether add form is shown
 * @param {number} props.editingPostId - ID of post being edited (null if none)
 * @param {Object} props.postFormData - Current post form data
 * @param {Function} props.onStartAddPost - Callback to show add post form
 * @param {Function} props.onCancelAddPost - Callback to cancel add post
 * @param {Function} props.onSavePost - Callback to save new post
 * @param {Function} props.onStartEditPost - Callback to start editing a post
 * @param {Function} props.onCancelEditPost - Callback to cancel editing
 * @param {Function} props.onSaveEditPost - Callback to save edited post
 * @param {Function} props.onDeletePost - Callback to delete a post
 * @param {Function} props.onPostFormChange - Callback when post form data changes
 */
export default function PostList({
  posts = [],
  creatorId,
  isAddingPost,
  editingPostId,
  postFormData,
  onStartAddPost,
  onCancelAddPost,
  onSavePost,
  onStartEditPost,
  onCancelEditPost,
  onSaveEditPost,
  onDeletePost,
  onPostFormChange
}) {
  return (
    <div className="mt-4 space-y-3">
      {/* Add Post Button */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Posts ({posts.length})
        </h4>
        <button
          onClick={onStartAddPost}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Post
        </button>
      </div>

      {/* Add Post Form */}
      {isAddingPost && (
        <PostForm
          formData={postFormData}
          onChange={onPostFormChange}
          onSubmit={onSavePost}
          onCancel={onCancelAddPost}
          isEditing={false}
        />
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">
          <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No posts yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id}>
              {editingPostId === post.id ? (
                <PostForm
                  formData={postFormData}
                  onChange={onPostFormChange}
                  onSubmit={() => onSaveEditPost(post.id)}
                  onCancel={onCancelEditPost}
                  isEditing={true}
                />
              ) : (
                <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text-primary)] font-medium truncate">
                        {post.description}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[var(--color-text-secondary)]">
                        <span>
                          {post.date ? new Date(post.date).toLocaleDateString() : 'No date'}
                        </span>
                        <span>${post.cost || 0}</span>
                        {post.impressions && (
                          <span>{post.impressions.toLocaleString()} views</span>
                        )}
                        {post.link && (
                          <a
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] transition-colors"
                          >
                            View Post
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onStartEditPost(post)}
                        className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] transition-colors"
                        title="Edit post"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePost(post.id)}
                        className="p-1.5 text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
