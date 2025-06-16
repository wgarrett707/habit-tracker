import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AllHabitsCalendar from '../components/AllHabitsCalendar';

interface Habit {
  id: number;
  name: string;
  color: string;
}

const AllHabits: React.FC = () => {
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch('http://localhost:3000/habits');
      const data = await response.json();
      setHabits(data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px' 
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          ← Back
        </button>
        <h1 style={{ color: 'white' }}>All Habits</h1>
        <div style={{ width: '30px' }}></div>
      </div>
      
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <AllHabitsCalendar habits={habits} />
      </div>

      <div style={{ 
        marginTop: '20px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px', 
        justifyContent: 'center',
        maxWidth: '400px'
      }}>
        {habits.map(habit => (
          <div key={habit.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: habit.color,
              borderRadius: '2px'
            }} />
            <span style={{ color: 'white', fontSize: '14px' }}>{habit.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllHabits; 