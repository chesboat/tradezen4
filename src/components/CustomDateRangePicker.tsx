/**
 * Custom Date Range Picker - Premium Feature
 * Apple Calendar style date selection
 * Clean, minimal, intuitive
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomDateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (startDate: Date | null, endDate: Date | null) => void;
  onClose: () => void;
}

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  onClose,
}) => {
  const [localStartDate, setLocalStartDate] = useState<Date | null>(startDate);
  const [localEndDate, setLocalEndDate] = useState<Date | null>(endDate);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSelectingStart, setIsSelectingStart] = useState(true);

  // Generate calendar days for current month
  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    const startPadding = firstDay.getDay(); // 0 = Sunday
    const days: Array<Date | null> = [];
    
    // Add padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, monthIndex, day));
    }
    
    return days;
  };

  const days = generateCalendarDays(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDayClick = (day: Date) => {
    if (isSelectingStart) {
      setLocalStartDate(day);
      setLocalEndDate(null);
      setIsSelectingStart(false);
    } else {
      if (localStartDate && day < localStartDate) {
        // If end date is before start, swap them
        setLocalEndDate(localStartDate);
        setLocalStartDate(day);
      } else {
        setLocalEndDate(day);
      }
    }
  };

  const handleApply = () => {
    onDateChange(localStartDate, localEndDate);
    onClose();
  };

  const handleClear = () => {
    setLocalStartDate(null);
    setLocalEndDate(null);
    setIsSelectingStart(true);
  };

  const isDateInRange = (day: Date) => {
    if (!localStartDate || !localEndDate) return false;
    return day >= localStartDate && day <= localEndDate;
  };

  const isDateSelected = (day: Date) => {
    if (!day) return false;
    const dayStr = day.toDateString();
    return (
      dayStr === localStartDate?.toDateString() ||
      dayStr === localEndDate?.toDateString()
    );
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (day: Date) => {
    return day.toDateString() === new Date().toDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Custom Date Range
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selected Range Display */}
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Start Date</div>
              <div className={cn(
                "text-sm font-medium",
                isSelectingStart && "text-primary"
              )}>
                {localStartDate ? localStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select start'}
              </div>
            </div>
            <div className="flex-1 p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">End Date</div>
              <div className={cn(
                "text-sm font-medium",
                !isSelectingStart && "text-primary"
              )}>
                {localEndDate ? localEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select end'}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-semibold">{monthName}</div>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const inRange = isDateInRange(day);
              const selected = isDateSelected(day);
              const today = isToday(day);

              return (
                <motion.button
                  key={day.toISOString()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-lg text-sm transition-colors",
                    selected && "bg-primary text-primary-foreground font-semibold",
                    inRange && !selected && "bg-primary/20",
                    !selected && !inRange && "hover:bg-muted",
                    today && !selected && "border-2 border-primary"
                  )}
                >
                  {day.getDate()}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <button
            onClick={handleClear}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!localStartDate || !localEndDate}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomDateRangePicker;

