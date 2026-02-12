/**
 * Content Type Constants
 * Defines the types of content creators: social media, podcasts, and newsletters
 */

export const CONTENT_TYPES = {
  SOCIAL: 'social',
  PODCAST: 'podcast',
  NEWSLETTER: 'newsletter',
};

export const CONTENT_TYPE_LABELS = {
  [CONTENT_TYPES.SOCIAL]: 'Social Media',
  [CONTENT_TYPES.PODCAST]: 'Podcasts',
  [CONTENT_TYPES.NEWSLETTER]: 'Newsletters',
};

export const CONTENT_TYPE_ICONS = {
  [CONTENT_TYPES.SOCIAL]: 'Users',
  [CONTENT_TYPES.PODCAST]: 'Mic',
  [CONTENT_TYPES.NEWSLETTER]: 'Mail',
};

export const CONTENT_TYPE_OPTIONS = [
  {
    value: CONTENT_TYPES.SOCIAL,
    label: CONTENT_TYPE_LABELS[CONTENT_TYPES.SOCIAL],
    description: 'Social media creators (X, TikTok, Instagram, YouTube)',
  },
  {
    value: CONTENT_TYPES.PODCAST,
    label: CONTENT_TYPE_LABELS[CONTENT_TYPES.PODCAST],
    description: 'Podcast creators and hosts',
  },
  {
    value: CONTENT_TYPES.NEWSLETTER,
    label: CONTENT_TYPE_LABELS[CONTENT_TYPES.NEWSLETTER],
    description: 'Newsletter writers and publishers',
  },
];

/**
 * Get display label for a content type
 * @param {string} contentType - Content type value
 * @returns {string} Display label
 */
export function getContentTypeLabel(contentType) {
  return CONTENT_TYPE_LABELS[contentType] || 'Unknown';
}

/**
 * Get icon name for a content type
 * @param {string} contentType - Content type value
 * @returns {string} Icon name (for lucide-react)
 */
export function getContentTypeIcon(contentType) {
  return CONTENT_TYPE_ICONS[contentType] || 'Users';
}
