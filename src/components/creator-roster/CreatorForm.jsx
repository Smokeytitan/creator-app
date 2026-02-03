import { X } from 'lucide-react';

/**
 * CreatorForm - Form for adding or editing a creator
 * @param {Object} props
 * @param {Object} props.formData - Form data (name, handle, notes, costPerPost, platforms)
 * @param {Function} props.onChange - Callback when form data changes
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Function} props.onCancel - Callback when form is cancelled
 * @param {boolean} props.isEditing - Whether in edit mode (vs add mode)
 * @param {Array} props.availablePlatforms - List of available platforms
 */
export default function CreatorForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isEditing = false,
  availablePlatforms = ['X', 'TikTok', 'Instagram', 'YouTube', 'Facebook']
}) {
  const handleInputChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const togglePlatform = (platform) => {
    const platforms = formData.platforms || [];
    if (platforms.includes(platform)) {
      onChange({ ...formData, platforms: platforms.filter(p => p !== platform) });
    } else {
      onChange({ ...formData, platforms: [...platforms, platform] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <tr className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
      <td colSpan="7" className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {isEditing ? 'Edit Creator' : 'Add New Creator'}
            </h3>
            <button
              type="button"
              onClick={onCancel}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
                placeholder="Creator name"
                required
              />
            </div>

            {/* Handle */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Handle *
              </label>
              <input
                type="text"
                value={formData.handle}
                onChange={(e) => handleInputChange('handle', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
                placeholder="@handle"
                required
              />
            </div>

            {/* Cost per Post */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Cost per Post ($)
              </label>
              <input
                type="number"
                value={formData.costPerPost}
                onChange={(e) => handleInputChange('costPerPost', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
                placeholder="0"
                min="0"
              />
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {availablePlatforms.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      (formData.platforms || []).includes(platform)
                        ? 'bg-[var(--color-accent-primary)] text-white'
                        : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)] resize-none"
              placeholder="Additional notes..."
              rows="3"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {isEditing ? 'Save Changes' : 'Add Creator'}
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
