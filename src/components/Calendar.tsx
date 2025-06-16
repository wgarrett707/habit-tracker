import React, { useState, useEffect } from 'react';
import '../styles/calendar.css';

interface CalendarProps {
  selectedColor: string;
  habitId: number;
}

const Calendar: React.FC<CalendarProps> = ({ selectedColor, habitId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  useEffect(() => {
    fetchHabitLogs();
  }, [habitId]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const fetchHabitLogs = async () => {
    try {
      const response = await fetch(`http://localhost:3000/habits/${habitId}/logs`, {
        headers: getHeaders()
      });
      const dates = await response.json();
      setSelectedDays(dates.map((dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      }));
    } catch (error) {
      console.error('Error fetching habit logs:', error);
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

  const toggleDay = async (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const isSelected = selectedDays.some(d =>
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    );
    try {
      if (isSelected) {
        await fetch(`http://localhost:3000/habits/${habitId}/logs`, {
          method: 'DELETE',
          headers: getHeaders(),
          body: JSON.stringify({ date: dateStr })
        });
        setSelectedDays(selectedDays.filter(d =>
          d.getDate() !== date.getDate() ||
          d.getMonth() !== date.getMonth() ||
          d.getFullYear() !== date.getFullYear()
        ));
      } else {
        await fetch(`http://localhost:3000/habits/${habitId}/logs`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ date: dateStr })
        });
        setSelectedDays([...selectedDays, date]);
      }
    } catch (error) {
      console.error('Error toggling habit log:', error);
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
            onClick={() => toggleDay(day.date, day.isCurrentMonth)}
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