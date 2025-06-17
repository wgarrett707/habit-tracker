import React, { useState, useEffect } from 'react';
import AllHabitsCalendar from '../components/AllHabitsCalendar';

const AllHabits: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <div className="all-habits">
      <h1>All Habits</h1>
      <AllHabitsCalendar />
    </div>
  );
};

export default AllHabits; 