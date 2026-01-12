import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { X, Calendar, Clock, Tag, DollarSign } from 'lucide-react';
import { createCampaign } from '../services/flashCampaignService';

const CampaignCreationModal = ({ isOpen, onClose, onCampaignCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDateTime: new Date(),
    endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 1 week from now
    keyPhrasesInput: '',
    rewardPool: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Campaign name required
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    // End time must be after start time
    if (formData.endDateTime <= formData.startDateTime) {
      newErrors.endDateTime = 'End time must be after start time';
    }

    // At least one key phrase required
    const keyPhrases = formData.keyPhrasesInput
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (keyPhrases.length === 0) {
      newErrors.keyPhrasesInput = 'At least one key phrase is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse key phrases (comma-separated)
      const keyPhrases = formData.keyPhrasesInput
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      // Convert selected time to EST
      // User sees/picks time in EST, but DatePicker stores it in browser's local time
      // We need to interpret the date/time AS IF it were in EST timezone
      const convertToEST = (localDate) => {
        // Format: "2025-01-11 15:30:00" - treat this as EST time
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const hours = String(localDate.getHours()).padStart(2, '0');
        const minutes = String(localDate.getMinutes()).padStart(2, '0');

        // Create an ISO string for EST timezone explicitly
        // This creates the date in EST and returns UTC timestamp
        const estString = `${year}-${month}-${day}T${hours}:${minutes}:00-05:00`; // -05:00 is EST offset
        return new Date(estString);
      };

      // Create campaign
      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        startDateTime: convertToEST(formData.startDateTime).toISOString(),
        endDateTime: convertToEST(formData.endDateTime).toISOString(),
        keyPhrases,
        rewardPool: formData.rewardPool.trim()
      };

      const newCampaign = createCampaign(campaignData);

      // Notify parent
      if (onCampaignCreated) {
        onCampaignCreated(newCampaign);
      }

      // Reset form and close
      setFormData({
        name: '',
        description: '',
        startDateTime: new Date(),
        endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        keyPhrasesInput: '',
        rewardPool: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: 'Failed to create campaign. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="card-editorial w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-display text-2xl mb-1">Create Flash Campaign</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Set up a new campaign to track creator content submissions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Campaign Name <span className="text-[var(--color-accent-primary)]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Polygon zkEVM Week 1"
              className={`w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] transition-all ${
                errors.name ? 'border-red-500' : 'border-white/10'
              }`}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the campaign goals and requirements"
              rows={3}
              className="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] transition-all resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Date/Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date/Time */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date & Time (EST) <span className="text-[var(--color-accent-primary)]">*</span>
              </label>
              <DatePicker
                selected={formData.startDateTime}
                onChange={(date) => handleChange('startDateTime', date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMM d, yyyy h:mm aa"
                timeZone="America/New_York"
                className="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] transition-all"
                disabled={isSubmitting}
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Eastern Standard Time
              </p>
            </div>

            {/* End Date/Time */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Date & Time (EST) <span className="text-[var(--color-accent-primary)]">*</span>
              </label>
              <DatePicker
                selected={formData.endDateTime}
                onChange={(date) => handleChange('endDateTime', date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMM d, yyyy h:mm aa"
                timeZone="America/New_York"
                minDate={formData.startDateTime}
                className={`w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] transition-all ${
                  errors.endDateTime ? 'border-red-500' : 'border-white/10'
                }`}
                disabled={isSubmitting}
              />
              {errors.endDateTime && (
                <p className="text-red-500 text-sm mt-1">{errors.endDateTime}</p>
              )}
            </div>
          </div>

          {/* Key Phrases */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Key Phrases <span className="text-[var(--color-accent-primary)]">*</span>
            </label>
            <input
              type="text"
              value={formData.keyPhrasesInput}
              onChange={(e) => handleChange('keyPhrasesInput', e.target.value)}
              placeholder="e.g., polygon zkEVM, #PolygonLabs, POL token"
              className={`w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] transition-all ${
                errors.keyPhrasesInput ? 'border-red-500' : 'border-white/10'
              }`}
              disabled={isSubmitting}
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Separate multiple phrases with commas. Matching is case-insensitive.
            </p>
            {errors.keyPhrasesInput && (
              <p className="text-red-500 text-sm mt-1">{errors.keyPhrasesInput}</p>
            )}
          </div>

          {/* Reward Pool */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Reward Pool (Optional)
            </label>
            <input
              type="text"
              value={formData.rewardPool}
              onChange={(e) => handleChange('rewardPool', e.target.value)}
              placeholder="e.g., $5,000 USD or 10,000 POL"
              className="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] transition-all"
              disabled={isSubmitting}
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              For tracking purposes only (not used in calculations)
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-500 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-editorial-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-editorial-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignCreationModal;
