import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination Component
 * Provides paginated navigation for large datasets
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.itemsPerPage - Items per page
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {Function} props.onItemsPerPageChange - Callback when items per page changes
 * @param {Array} props.pageSizeOptions - Available page size options
 * @param {boolean} props.showPageSize - Whether to show page size selector
 * @param {boolean} props.showItemCount - Whether to show item count
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSize = true,
  showItemCount = true
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    onItemsPerPageChange(newSize);
    // Reset to page 1 when changing page size
    onPageChange(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Show max 7 page buttons

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1 && !showItemCount) {
    return null; // Don't show pagination if only 1 page
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-3 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
      {/* Item count and page size selector */}
      <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
        {showItemCount && (
          <span>
            Showing {startItem} to {endItem} of {totalItems} items
          </span>
        )}
        {showPageSize && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="page-size">Per page:</label>
            <select
              id="page-size"
              value={itemsPerPage}
              onChange={handlePageSizeChange}
              className="px-2 py-1 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-accent-primary)]"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-2">
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-[var(--color-text-secondary)]"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`min-w-[32px] px-2 py-1 rounded text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-[var(--color-accent-primary)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] hover:bg-[var(--color-bg-primary)]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next page */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * usePagination Hook
 * Provides pagination state management
 *
 * @param {Array} items - Array of items to paginate
 * @param {number} initialItemsPerPage - Initial items per page
 * @returns {Object} Pagination state and functions
 */
export function usePagination(items = [], initialItemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  // Reset to page 1 when items change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, totalPages, currentPage]);

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    totalItems: items.length,
    currentItems,
    startIndex,
    endIndex
  };
}

// Add missing import
import { useState, useEffect } from 'react';
