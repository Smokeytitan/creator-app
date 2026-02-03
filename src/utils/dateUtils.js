/**
 * Date Utility Functions
 * Centralized date handling and formatting
 */

/**
 * Format a date to locale string
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'en-US') {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString(locale);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
}

/**
 * Format a date to locale string with time
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date, locale = 'en-US') {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString(locale);
  } catch (error) {
    console.error('Error formatting date time:', error);
    return String(date);
  }
}

/**
 * Format a date to ISO string (YYYY-MM-DD) for input[type="date"]
 * @param {string|Date} date - Date to format
 * @returns {string} ISO date string
 */
export function formatDateForInput(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return '';

  try {
    const now = new Date();
    const then = new Date(date);
    const diffMs = then - now;
    const diffSec = Math.floor(Math.abs(diffMs) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    const isPast = diffMs < 0;
    const suffix = isPast ? 'ago' : 'from now';

    if (diffYear > 0) {
      return `${diffYear} year${diffYear > 1 ? 's' : ''} ${suffix}`;
    } else if (diffMonth > 0) {
      return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ${suffix}`;
    } else if (diffWeek > 0) {
      return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ${suffix}`;
    } else if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ${suffix}`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ${suffix}`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ${suffix}`;
    } else {
      return 'just now';
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return String(date);
  }
}

/**
 * Check if a date is valid
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if valid date
 */
export function isValidDate(date) {
  if (!date) return false;
  try {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  } catch {
    return false;
  }
}

/**
 * Parse date from various formats
 * @param {string|Date} date - Date to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseDate(date) {
  if (!date) return null;
  try {
    const d = new Date(date);
    return isValidDate(d) ? d : null;
  } catch {
    return null;
  }
}

/**
 * Get date range (start and end) for common periods
 * @param {string} period - 'today', 'week', 'month', 'year'
 * @returns {Object} { start: Date, end: Date }
 */
export function getDateRange(period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 86400000 - 1) // End of day
      };

    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return { start: weekStart, end: weekEnd };

    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: monthStart, end: monthEnd };

    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      return { start: yearStart, end: yearEnd };

    default:
      return { start: today, end: now };
  }
}

/**
 * Add days to a date
 * @param {string|Date} date - Base date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} New date
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Add months to a date
 * @param {string|Date} date - Base date
 * @param {number} months - Number of months to add (can be negative)
 * @returns {Date} New date
 */
export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Get number of days between two dates
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {number} Number of days
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2 - d1);
  return Math.floor(diffMs / 86400000);
}
