import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

/**
 * DateRangePicker - Expedia-style date range selection
 *
 * Two-click interaction:
 * 1. Click a day → sets start date
 * 2. Click another day → sets end date, closes picker
 *
 * Features:
 * - Single month view with prev/next navigation
 * - Visual range highlighting between start and end
 * - Preset ranges (7D, 30D, 90D, All)
 * - Hover preview while selecting end date
 */
export default function DateRangePicker({ onRangeChange, currentRange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); // month being shown
  const [selecting, setSelecting] = useState(null); // null | 'start' | 'end'
  const [tempStart, setTempStart] = useState(null); // Date during selection
  const [hoverDate, setHoverDate] = useState(null); // Date being hovered

  // Parse current range into Date objects
  const rangeStart = currentRange?.startDate ? new Date(currentRange.startDate + 'T00:00:00') : null;
  const rangeEnd = currentRange?.endDate ? new Date(currentRange.endDate + 'T00:00:00') : null;

  const presets = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: 'All', days: null }
  ];

  const handlePresetClick = (preset) => {
    if (preset.days === null) {
      onRangeChange({ startDate: null, endDate: null, label: 'All Time' });
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - preset.days);
      onRangeChange({
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        label: `Last ${preset.days} Days`
      });
    }
    setSelecting(null);
    setTempStart(null);
    setIsOpen(false);
  };

  const handleDayClick = (date) => {
    if (!selecting || selecting === 'start') {
      // First click — set start date
      setTempStart(date);
      setSelecting('end');
    } else {
      // Second click — set end date
      let start = tempStart;
      let end = date;

      // Swap if user clicked a date before the start
      if (end < start) {
        [start, end] = [end, start];
      }

      onRangeChange({
        startDate: toDateStr(start),
        endDate: toDateStr(end),
        label: 'Custom Range'
      });
      setSelecting(null);
      setTempStart(null);
      setIsOpen(false);
    }
  };

  const openPicker = () => {
    setIsOpen(true);
    setSelecting('start');
    setHoverDate(null);
    // Show current month (or the month of the start date if set)
    if (rangeStart) {
      setViewDate(new Date(rangeStart));
    } else {
      setViewDate(new Date());
    }
  };

  // Calendar helpers
  const toDateStr = (d) => d.toISOString().split('T')[0];
  const isSameDay = (a, b) => a && b && toDateStr(a) === toDateStr(b);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year, month) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfWeek(year, month);
    const days = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [year, month]);

  // Determine if a day is in the selected/hovered range
  const getDayState = (date) => {
    if (!date) return {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = isSameDay(date, today);
    const isFuture = date > today;

    // During selection — show temp range
    if (selecting === 'end' && tempStart) {
      const isStart = isSameDay(date, tempStart);
      const previewEnd = hoverDate || tempStart;
      let rStart = tempStart;
      let rEnd = previewEnd;
      if (rEnd < rStart) [rStart, rEnd] = [rEnd, rStart];
      const inRange = date >= rStart && date <= rEnd && !isSameDay(date, rStart) && !isSameDay(date, rEnd);
      const isEnd = isSameDay(date, previewEnd);

      return { isStart, isEnd: isEnd && !isStart, inRange, isToday, isFuture };
    }

    // Show committed range
    if (rangeStart && rangeEnd) {
      const isStart = isSameDay(date, rangeStart);
      const isEnd = isSameDay(date, rangeEnd);
      const inRange = date > rangeStart && date < rangeEnd;
      return { isStart, isEnd, inRange, isToday, isFuture };
    }

    return { isToday, isFuture };
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const getCurrentLabel = () => {
    if (!currentRange || (!currentRange.startDate && !currentRange.endDate)) {
      return 'All Time';
    }
    if (currentRange.startDate && currentRange.endDate) {
      const s = new Date(currentRange.startDate + 'T00:00:00');
      const e = new Date(currentRange.endDate + 'T00:00:00');
      const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${fmt(s)} – ${fmt(e)}`;
    }
    return currentRange.label || 'Custom Range';
  };

  const isAllTime = !currentRange?.startDate && !currentRange?.endDate;

  return (
    <div className="relative">
      {/* Trigger area */}
      <div className="flex items-center gap-2">
        {/* Presets */}
        <div className="flex items-center gap-1">
          {presets.map(({ label, days }) => (
            <button
              key={label}
              onClick={() => handlePresetClick({ label, days })}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                (days === null && isAllTime) ||
                (currentRange?.label === `Last ${days} Days`)
                  ? 'bg-[var(--color-accent-primary)] text-white'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Calendar trigger */}
        <button
          onClick={openPicker}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
            !isAllTime
              ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/30 text-[var(--color-accent-primary)]'
              : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isAllTime ? 'Custom' : getCurrentLabel()}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setIsOpen(false); setSelecting(null); setTempStart(null); }} />

          <div className="absolute right-0 top-full mt-2 z-20 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-2xl p-4 w-[300px]">
            {/* Selection hint */}
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3 text-center">
              {selecting === 'start' ? 'Select start date' : 'Select end date'}
            </p>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevMonth}
                className="p-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{monthName}</span>
              <button
                onClick={nextMonth}
                className="p-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day of week headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-[var(--color-text-tertiary)] py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />;

                const state = getDayState(date);
                const dayNum = date.getDate();

                return (
                  <div
                    key={i}
                    className={`relative ${state.inRange ? 'bg-[var(--color-accent-primary)]/10' : ''}`}
                  >
                    <button
                      onClick={() => handleDayClick(date)}
                      onMouseEnter={() => selecting === 'end' && setHoverDate(date)}
                      className={`
                        w-full aspect-square flex items-center justify-center text-xs rounded-md transition-colors relative z-10
                        ${state.isStart || state.isEnd
                          ? 'bg-[var(--color-accent-primary)] text-white font-bold'
                          : state.inRange
                            ? 'text-[var(--color-text-primary)] hover:bg-[var(--color-accent-primary)]/20'
                            : state.isToday
                              ? 'text-[var(--color-accent-primary)] font-bold hover:bg-[var(--color-bg-tertiary)]'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                        }
                      `}
                    >
                      {dayNum}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Clear button */}
            {(rangeStart || tempStart) && (
              <button
                onClick={() => {
                  onRangeChange({ startDate: null, endDate: null, label: 'All Time' });
                  setSelecting(null);
                  setTempStart(null);
                  setIsOpen(false);
                }}
                className="w-full mt-3 px-3 py-1.5 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors text-center"
              >
                Clear dates
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
