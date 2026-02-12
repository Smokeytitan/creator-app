import { AVAILABLE_PLATFORMS } from '../../constants/platforms';
import { CONTENT_TYPES, CONTENT_TYPE_OPTIONS } from '../../constants/contentTypes';

/**
 * Creator edit form (inline card).
 * Used for both "Add New" and "Edit Existing" modes.
 */
export default function CreatorCardEdit({
  editForm,
  setEditForm,
  togglePlatform,
  onSave,
  onCancel,
  isNew = false,
}) {
  // Support both single value (legacy) and array (new multi-select)
  const contentTypes = Array.isArray(editForm.contentType)
    ? editForm.contentType
    : (editForm.contentType ? [editForm.contentType] : [CONTENT_TYPES.SOCIAL]);

  const isSocial = contentTypes.includes(CONTENT_TYPES.SOCIAL);
  const isPodcast = contentTypes.includes(CONTENT_TYPES.PODCAST);
  const isNewsletter = contentTypes.includes(CONTENT_TYPES.NEWSLETTER);

  // Toggle content type (multi-select)
  const toggleContentType = (type) => {
    let newTypes;
    if (contentTypes.includes(type)) {
      // Remove if already selected (but keep at least one)
      newTypes = contentTypes.filter(t => t !== type);
      if (newTypes.length === 0) newTypes = [type]; // Keep at least one selected
    } else {
      // Add if not selected
      newTypes = [...contentTypes, type];
    }
    setEditForm({ ...editForm, contentType: newTypes });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
          Name {isNew ? '*' : ''}
        </label>
        <input
          type="text"
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
          value={editForm.name}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Creator name"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
          Handle
        </label>
        <input
          type="text"
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
          value={editForm.handle}
          onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="@username"
        />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
          Content Type <span className="normal-case text-[10px] opacity-70">(select one or more)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleContentType(option.value);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                contentTypes.includes(option.value)
                  ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white shadow-sm'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
              }`}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
        {contentTypes.length > 1 && (
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
            Selected: {contentTypes.map(t => CONTENT_TYPE_OPTIONS.find(o => o.value === t)?.label).join(', ')}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
          Notes
        </label>
        <input
          type="text"
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
          value={editForm.notes}
          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Optional notes"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
          Cost Per Post
        </label>
        <input
          type="text"
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
          value={editForm.costPerPost}
          onChange={(e) => setEditForm({ ...editForm, costPerPost: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="e.g., $1,250.00"
        />
      </div>

      {/* Social Media Platforms - only for social content type */}
      {isSocial && (
        <div onClick={(e) => e.stopPropagation()}>
          <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">
            Platforms
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_PLATFORMS.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlatform(platform);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  (editForm.platforms || []).includes(platform)
                    ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Podcast RSS URL */}
      {isPodcast && (
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
            🎙️ Podcast RSS URL
          </label>
          <input
            type="url"
            className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            value={editForm.podcastUrl || ''}
            onChange={(e) => setEditForm({ ...editForm, podcastUrl: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="https://podcast.example.com/feed"
          />
        </div>
      )}

      {/* Podcast Listeners */}
      {isPodcast && (
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
            🎙️ Average Listeners per Episode
          </label>
          <input
            type="text"
            className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            value={editForm.podcastListeners || ''}
            onChange={(e) => setEditForm({ ...editForm, podcastListeners: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="e.g., 25,000"
          />
        </div>
      )}

      {/* Newsletter Subscription URL */}
      {isNewsletter && (
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
            ✉️ Newsletter Subscription URL
          </label>
          <input
            type="url"
            className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            value={editForm.newsletterUrl || ''}
            onChange={(e) => setEditForm({ ...editForm, newsletterUrl: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="https://newsletter.example.com/subscribe"
          />
        </div>
      )}

      {/* Newsletter Subscribers */}
      {isNewsletter && (
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
            ✉️ Total Subscribers
          </label>
          <input
            type="text"
            className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            value={editForm.newsletterSubscribers || ''}
            onChange={(e) => setEditForm({ ...editForm, newsletterSubscribers: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="e.g., 100,000"
          />
        </div>
      )}

      {/* Social Media Followers/Reach - shown for any type */}
      {(isSocial || isPodcast || isNewsletter) && (
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
            📊 Total Audience/Reach
            <span className="normal-case text-[10px] opacity-70 ml-1">
              (followers, impressions, or combined reach)
            </span>
          </label>
          <input
            type="text"
            className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            value={editForm.totalReach || ''}
            onChange={(e) => setEditForm({ ...editForm, totalReach: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="e.g., 500,000"
          />
        </div>
      )}

      <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
        <button
          className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-lg hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200 font-semibold"
          onClick={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          {isNew ? 'Create' : 'Save'}
        </button>
        <button
          className="flex-1 px-4 py-2 text-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
