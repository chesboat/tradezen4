import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  selectedDate?: Date;
  title?: string;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  selectedDate,
  title = "Select Date"
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get first day of the month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Get previous month's last days to fill the grid
  const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();

  // Generate calendar days
  const calendarDays: Array<{
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
  }> = [];

  // Previous month's trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i);
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isSelected: selectedDate ? date.toDateString() === selectedDate.toDateString() : false
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    calendarDays.push({
      date,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString(),
      isSelected: selectedDate ? date.toDateString() === selectedDate.toDateString() : false
    });
  }

  // Next month's leading days to complete the grid (42 days = 6 weeks)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isSelected: selectedDate ? date.toDateString() === selectedDate.toDateString() : false
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateSelect = (date: Date) => {
    onSelectDate(date);
    onClose();
  };

  const handleQuickSelect = (daysFromToday: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysFromToday);
    handleDateSelect(date);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Calendar Modal */}
        <motion.div
          className="relative bg-card border border-border rounded-xl shadow-xl max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">{title}</h3>
            </div>
            <motion.button
              className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground"
              onClick={onClose}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                className="py-2 px-3 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                onClick={() => handleQuickSelect(0)}
                whileTap={{ scale: 0.98 }}
              >
                Today
              </motion.button>
              <motion.button
                className="py-2 px-3 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                onClick={() => handleQuickSelect(1)}
                whileTap={{ scale: 0.98 }}
              >
                Tomorrow
              </motion.button>
              <motion.button
                className="py-2 px-3 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                onClick={() => handleQuickSelect(7)}
                whileTap={{ scale: 0.98 }}
              >
                Next Week
              </motion.button>
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between p-4">
            <motion.button
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground"
              onClick={() => navigateMonth('prev')}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            
            <h4 className="font-semibold text-foreground">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            
            <motion.button
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground"
              onClick={() => navigateMonth('next')}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 pt-0">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayInfo, index) => (
                <motion.button
                  key={index}
                  className={cn(
                    'h-8 w-8 flex items-center justify-center text-sm rounded-lg transition-colors relative',
                    dayInfo.isCurrentMonth
                      ? 'text-foreground hover:bg-accent'
                      : 'text-muted-foreground/50 hover:bg-accent/50',
                    dayInfo.isToday && 'bg-primary/10 text-primary font-semibold',
                    dayInfo.isSelected && 'bg-primary text-primary-foreground font-semibold',
                    dayInfo.date < today && dayInfo.isCurrentMonth && 'opacity-50'
                  )}
                  onClick={() => handleDateSelect(dayInfo.date)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={dayInfo.date < today}
                >
                  {dayInfo.date.getDate()}
                  {dayInfo.isToday && !dayInfo.isSelected && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <motion.button
                className="flex-1 py-2 px-4 bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-lg transition-colors"
                onClick={onClose}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                className="flex-1 py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                onClick={() => handleDateSelect(today)}
                whileTap={{ scale: 0.98 }}
              >
                Today
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
