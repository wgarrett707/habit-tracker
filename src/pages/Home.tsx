import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Habit {
  id: number;
  name: string;
}

const Home: React.FC = () => {
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

  const addHabit = async () => {
    const name = prompt('Enter habit name:');
    if (name?.trim()) {
      try {
        const response = await fetch('http://localhost:3000/habits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: name.trim() }),
        });
        const newHabit = await response.json();
        setHabits([...habits, newHabit]);
      } catch (error) {
        console.error('Error adding habit:', error);
      }
    }
  };

  const deleteHabit = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this habit?')) {
      await fetch(`http://localhost:3000/habits/${id}`, { method: 'DELETE' });
      setHabits(habits.filter(h => h.id !== id));
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
      <h1 style={{ color: 'white', marginBottom: '20px' }}>Habit Tracker</h1>
      {habits.map((habit) => (
        <button 
          key={habit.id}
          onClick={() => navigate(`/habits/${habit.id}`)} 
          style={{ 
            margin: '10px', 
            padding: '10px 20px', 
            borderRadius: '20px', 
            border: 'none',
            backgroundColor: '#333',
            color: 'white',
            cursor: 'pointer',
            width: '200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {habit.name}
          <span 
            onClick={(e) => deleteHabit(habit.id, e)}
            style={{ 
              color: '#ff4444', 
              cursor: 'pointer',
              position: 'absolute',
              right: '20px'
            }}
          >×</span>
        </button>
      ))}
      <button 
        onClick={addHabit}
        style={{ 
          margin: '20px', 
          padding: '10px 20px', 
          borderRadius: '20px', 
          border: 'none',
          backgroundColor: '#0066cc',
          color: 'white',
          cursor: 'pointer',
          width: '200px'
        }}
      >
        + Add Habit
      </button>
    </div>
  );
};

export default Home; 