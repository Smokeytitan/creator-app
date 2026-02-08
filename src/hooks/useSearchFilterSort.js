import { useState, useMemo, useCallback } from 'react';

/**
 * Shared search / filter / sort logic for creator lists.
 *
 * @param {object} options
 * @param {Array}    options.items        - Full list of items to filter
 * @param {string[]} [options.searchFields=['name','handle']] - Fields to search on
 */
export default function useSearchFilterSort({ items, searchFields = ['name', 'handle'] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivity, setFilterActivity] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(search);
        })
      );
    }

    // Activity filter
    if (filterActivity === 'active') {
      filtered = filtered.filter((c) => (c.posts || []).length > 0);
    } else if (filterActivity === 'inactive') {
      filtered = filtered.filter((c) => (c.posts || []).length === 0);
    } else if (filterActivity === 'has_cost') {
      filtered = filtered.filter(
        (c) => c.costPerPost && parseFloat(String(c.costPerPost).replace(/[^0-9.]/g, '')) > 0
      );
    } else if (filterActivity === 'no_cost') {
      filtered = filtered.filter(
        (c) => !c.costPerPost || parseFloat(String(c.costPerPost).replace(/[^0-9.]/g, '')) === 0
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'posts':
          return (b.posts || []).length - (a.posts || []).length;
        case 'cost': {
          const costA = parseFloat(String(a.costPerPost || '0').replace(/[^0-9.]/g, ''));
          const costB = parseFloat(String(b.costPerPost || '0').replace(/[^0-9.]/g, ''));
          return costB - costA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchTerm, filterActivity, sortBy, searchFields]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterActivity('all');
    setSortBy('name');
  }, []);

  const hasActiveFilters = searchTerm || filterActivity !== 'all' || sortBy !== 'name';

  return {
    searchTerm,
    setSearchTerm,
    filterActivity,
    setFilterActivity,
    sortBy,
    setSortBy,
    filteredItems,
    clearFilters,
    hasActiveFilters,
  };
}
