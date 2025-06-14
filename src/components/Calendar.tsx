import React, { useState } from 'react';
import '../styles/calendar.css';

interface CalendarProps {
  selectedColor: string;
}

const Calendar: React.FC<CalendarProps> = ({ selectedColor }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const days = getDaysInMonth(currentDate);

  const isDaySelected = (date: Date) => {
    return selectedDays.some(selectedDate => 
      selectedDate.getDate() === date.getDate() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getFullYear() === date.getFullYear()
    );
  };

  const toggleDay = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return; // Don't allow selecting days from other months
    
    setSelectedDays(prev => {
      if (isDaySelected(date)) {
        return prev.filter(selectedDate => 
          !(selectedDate.getDate() === date.getDate() &&
            selectedDate.getMonth() === date.getMonth() &&
            selectedDate.getFullYear() === date.getFullYear())
        );
      } else {
        return [...prev, date];
      }
    });
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>←</button>
        <h2>{formatMonthYear(currentDate)}</h2>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>→</button>
      </div>
      <div className="calendar-grid">
        {weekdays.map(day => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            className={`day ${isToday(day.date) ? 'today' : ''} ${!day.isCurrentMonth ? 'other-month' : ''} ${isDaySelected(day.date) ? 'selected' : ''}`}
            onClick={() => toggleDay(day.date, day.isCurrentMonth)}
            style={isDaySelected(day.date) ? { backgroundColor: selectedColor } : undefined}
          >
            {day.date.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar; 