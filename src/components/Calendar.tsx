import React, { useState, useEffect } from 'react';
import '../styles/calendar.css';
import { api } from '../api';

interface CalendarProps {
  selectedColor: string;
  habitId: number;
}

const Calendar: React.FC<CalendarProps> = ({ selectedColor, habitId }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  useEffect(() => {
    fetchLogs();
  }, [habitId, currentDate]);

  const fetchLogs = async () => {
    try {
      const data = await api.get(`/habits/${habitId}/logs`);
      setLogs(data);
      setSelectedDays(data.map((dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

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

  const toggleLog = async (date: string) => {
    try {
      if (logs.includes(date)) {
        await api.delete(`/habits/${habitId}/logs`);
      } else {
        await api.post(`/habits/${habitId}/logs`, { date });
      }
      fetchLogs();
    } catch (error) {
      console.error('Error toggling log:', error);
    }
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
            className={`day ${isToday(day.date) ? 'today' : ''} ${!day.isCurrentMonth ? 'other-month' : ''} ${selectedDays.some(d => 
              d.getDate() === day.date.getDate() &&
              d.getMonth() === day.date.getMonth() &&
              d.getFullYear() === day.date.getFullYear()
            ) ? 'selected' : ''}`}
            onClick={() => toggleLog(`${day.date.getFullYear()}-${day.date.getMonth() + 1}-${day.date.getDate()}`)}
            style={selectedDays.some(d => 
              d.getDate() === day.date.getDate() &&
              d.getMonth() === day.date.getMonth() &&
              d.getFullYear() === day.date.getFullYear()
            ) ? { backgroundColor: selectedColor } : undefined}
          >
            {day.date.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar; 