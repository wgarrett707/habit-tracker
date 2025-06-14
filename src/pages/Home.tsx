import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [habits, setHabits] = useState(['Habit 1', 'Habit 2', 'Habit 3']);

  const addHabit = () => {
    const name = prompt('Enter habit name:');
    if (name?.trim()) {
      setHabits([...habits, name.trim()]);
    }
  };

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
      {habits.map((habit, index) => (
        <button 
          key={index}
          onClick={() => navigate(`/habits/${index + 1}`)} 
          style={{ 
            margin: '10px', 
            padding: '10px 20px', 
            borderRadius: '20px', 
            border: 'none',
            backgroundColor: '#333',
            color: 'white',
            cursor: 'pointer',
            width: '200px'
          }}
        >
          {habit}
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