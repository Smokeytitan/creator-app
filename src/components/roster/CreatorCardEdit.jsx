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
  const contentType = editForm.contentType || CONTENT_TYPES.SOCIAL;
  const isSocial = contentType === CONTENT_TYPES.SOCIAL;
  const isPodcast = contentType === CONTENT_TYPES.PODCAST;
  const isNewsletter = contentType === CONTENT_TYPES.NEWSLETTER;

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
        <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">
          Content Type
        </label>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditForm({ ...editForm, contentType: option.value });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                contentType === option.value
                  ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
              }`}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
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

      {/* Content URL - for podcasts and newsletters */}
      {(isPodcast || isNewsletter) && (
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
            {isPodcast ? 'Podcast RSS URL' : 'Newsletter Subscription URL'}
          </label>
          <input
            type="url"
            className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            value={editForm.contentUrl || ''}
            onChange={(e) => setEditForm({ ...editForm, contentUrl: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder={isPodcast ? 'https://podcast.example.com/feed' : 'https://newsletter.example.com/subscribe'}
          />
        </div>
      )}

      {/* Subscriber Count - for podcasts and newsletters */}
      {(isPodcast || isNewsletter) && (
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
            Subscriber/Listener Count
          </label>
          <input
            type="text"
            className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            value={editForm.subscriberCount || ''}
            onChange={(e) => setEditForm({ ...editForm, subscriberCount: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="e.g., 50,000"
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
