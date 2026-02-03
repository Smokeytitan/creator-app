import { X } from 'lucide-react';

/**
 * PostForm - Form for adding or editing a post
 * @param {Object} props
 * @param {Object} props.formData - Form data (description, date, cost, link, impressions)
 * @param {Function} props.onChange - Callback when form data changes
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Function} props.onCancel - Callback when form is cancelled
 * @param {boolean} props.isEditing - Whether in edit mode (vs add mode)
 */
export default function PostForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isEditing = false
}) {
  const handleInputChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 border border-[var(--color-border)]">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {isEditing ? 'Edit Post' : 'Add New Post'}
          </h4>
          <button
            type="button"
            onClick={onCancel}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
              placeholder="Post description"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
              required
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Cost ($) *
            </label>
            <input
              type="number"
              value={formData.cost}
              onChange={(e) => handleInputChange('cost', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
              placeholder="0"
              min="0"
              required
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Link
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => handleInputChange('link', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
              placeholder="https://..."
            />
          </div>

          {/* Impressions */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Impressions
            </label>
            <input
              type="number"
              value={formData.impressions}
              onChange={(e) => handleInputChange('impressions', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-sm bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {isEditing ? 'Save' : 'Add Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
