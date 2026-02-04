import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

/**
 * DateRangePicker - Filter campaigns by date range
 *
 * Features:
 * - Preset ranges (Last 7/30/90 days, All time)
 * - Custom date range selection
 * - Dropdown UI with clear visual feedback
 */
export default function DateRangePicker({ onRangeChange, currentRange }) {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: 'Last 7 Days', value: 7, days: 7 },
    { label: 'Last 30 Days', value: 30, days: 30 },
    { label: 'Last 90 Days', value: 90, days: 90 },
    { label: 'All Time', value: 'all', days: null }
  ];

  const handlePresetClick = (preset) => {
    if (preset.value === 'all') {
      onRangeChange({ startDate: null, endDate: null, label: 'All Time' });
    } else {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - preset.days);
      onRangeChange({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        label: preset.label
      });
    }
    setIsOpen(false);
  };

  const getCurrentLabel = () => {
    if (!currentRange || (!currentRange.startDate && !currentRange.endDate)) {
      return 'All Time';
    }
    return currentRange.label || 'Custom Range';
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-neutral-900/50 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-neutral-800 hover:border-white/20 transition-colors"
      >
        <Calendar className="w-4 h-4 text-neutral-400" />
        <span>{getCurrentLabel()}</span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 z-20 w-48 bg-neutral-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
            {/* Presets */}
            <div className="py-1">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset)}
                  className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-neutral-800 transition-colors flex items-center justify-between"
                >
                  <span>{preset.label}</span>
                  {getCurrentLabel() === preset.label && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E5C473]" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Range Section */}
            <div className="border-t border-white/10 p-3">
              <p className="text-xs text-neutral-500 mb-2">Custom Range</p>
              <div className="space-y-2">
                <input
                  type="date"
                  className="w-full px-3 py-1.5 bg-neutral-800 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-white/20"
                  placeholder="Start date"
                  onChange={(e) => {
                    const startDate = e.target.value;
                    if (currentRange?.endDate) {
                      onRangeChange({
                        startDate,
                        endDate: currentRange.endDate,
                        label: 'Custom Range'
                      });
                      setIsOpen(false);
                    }
                  }}
                />
                <input
                  type="date"
                  className="w-full px-3 py-1.5 bg-neutral-800 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-white/20"
                  placeholder="End date"
                  onChange={(e) => {
                    const endDate = e.target.value;
                    if (currentRange?.startDate) {
                      onRangeChange({
                        startDate: currentRange.startDate,
                        endDate,
                        label: 'Custom Range'
                      });
                      setIsOpen(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
