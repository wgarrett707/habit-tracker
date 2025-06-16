import React, { useState, useEffect } from 'react';
import '../styles/calendar.css';

const API_URL = import.meta.env.PROD
  ? 'https://habit-tracker-fvbhqazba-wgarrett707s-projects.vercel.app/api'
  : 'http://localhost:3000/api';

interface Habit {
  id: number;
  name: string;
  color: string;
}

interface AllHabitsCalendarProps {
  habits: Habit[];
}

const AllHabitsCalendar: React.FC<AllHabitsCalendarProps> = ({ habits }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habitLogs, setHabitLogs] = useState<{ [key: string]: number[] }>({});
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  useEffect(() => {
    fetchAllHabitLogs();
  }, [habits]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const fetchAllHabitLogs = async () => {
    const logs: { [key: string]: number[] } = {};
    
    for (const habit of habits) {
      try {
        const response = await fetch(`${API_URL}/habits/${habit.id}/logs`, {
          headers: getHeaders()
        });
        const dates = await response.json();
        dates.forEach((dateStr: string) => {
          if (!logs[dateStr]) {
            logs[dateStr] = [];
          }
          logs[dateStr].push(habit.id);
        });
      } catch (error) {
        console.error(`Error fetching logs for habit ${habit.id}:`, error);
      }
    }
    
    setHabitLogs(logs);
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
    
    const remainingDays = 42 - days.length;
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

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const days = getDaysInMonth(currentDate);

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
        {days.map((day, index) => {
          const dateStr = formatDate(day.date);
          const habitIds = habitLogs[dateStr] || [];
          
          return (
            <div
              key={index}
              className={`day ${isToday(day.date) ? 'today' : ''} ${!day.isCurrentMonth ? 'other-month' : ''}`}
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <span style={{ 
                position: 'relative', 
                zIndex: 2,
                color: 'white',
                textShadow: '0 0 2px rgba(0,0,0,0.5)'
              }}>
                {day.date.getDate()}
              </span>
              {habitIds.map((habitId, i) => {
                const habit = habits.find(h => h.id === habitId);
                if (!habit) return null;
                
                const size = 100 - (i * 15); // Each square gets smaller
                return (
                  <div
                    key={habitId}
                    style={{
                      position: 'absolute',
                      width: `${size}%`,
                      height: `${size}%`,
                      backgroundColor: habit.color,
                      opacity: 0.7,
                      borderRadius: '4px',
                      zIndex: 1
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AllHabitsCalendar; 