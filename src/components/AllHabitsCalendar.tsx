import React, { useState, useEffect } from 'react';
import '../styles/calendar.css';
import { api } from '../api';

interface Habit {
  id: number;
  name: string;
  color: string;
}

const AllHabitsCalendar: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<number, string[]>>({});
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    habits.forEach(habit => {
      fetchLogs(habit.id);
    });
  }, [habits, currentDate]);

  const fetchHabits = async () => {
    try {
      const data = await api.get('/habits');
      setHabits(data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchLogs = async (habitId: number) => {
    try {
      const data = await api.get(`/habits/${habitId}/logs`);
      setLogs(prev => ({ ...prev, [habitId]: data }));
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Add days from next month
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
          &lt;
        </button>
        <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
          &gt;
        </button>
      </div>
      <div className="calendar-grid">
        {weekdays.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        {days.map((day, index) => {
          const dateStr = formatDate(day.date);
          const habitIds = Object.entries(logs)
            .filter(([_, dates]) => dates.includes(dateStr))
            .map(([id]) => parseInt(id));
          
          return (
            <div
              key={index}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''}`}
            >
              <span className="day-number">{day.date.getDate()}</span>
              <div className="habit-dots">
                {habitIds.map(habitId => {
                  const habit = habits.find(h => h.id === habitId);
                  return habit ? (
                    <div
                      key={habitId}
                      className="habit-dot"
                      style={{ backgroundColor: habit.color }}
                    />
                  ) : null;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AllHabitsCalendar; 