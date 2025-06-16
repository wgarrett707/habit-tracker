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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const fetchHabits = async () => {
    try {
      const response = await fetch('http://localhost:3000/habits', {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Received non-array data:', data);
        setHabits([]);
        setError('Invalid data format received from server');
        return;
      }
      
      setHabits(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching habits:', error);
      setError('Failed to fetch habits');
      setHabits([]);
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
          headers: getHeaders(),
          body: JSON.stringify({ name: name.trim() }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const newHabit = await response.json();
        setHabits(prevHabits => [...prevHabits, newHabit]);
      } catch (error) {
        console.error('Error adding habit:', error);
        alert('Failed to add habit');
      }
    }
  };

  const deleteHabit = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this habit?')) {
      try {
        const response = await fetch(`http://localhost:3000/habits/${id}`, { 
          method: 'DELETE',
          headers: getHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        setHabits(prevHabits => prevHabits.filter(h => h.id !== id));
      } catch (error) {
        console.error('Error deleting habit:', error);
        alert('Failed to delete habit');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#1a1a1a', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        color: 'white'
      }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#1a1a1a', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        color: 'white',
        padding: '20px'
      }}>
        <div style={{ color: '#ff4444', marginBottom: '20px' }}>{error}</div>
        <button 
          onClick={fetchHabits}
          style={{
            padding: '10px 20px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#0066cc',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

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
      <button 
        onClick={() => navigate('/all-habits')}
        style={{ 
          margin: '10px', 
          padding: '10px 20px', 
          borderRadius: '20px', 
          border: 'none',
          backgroundColor: '#0066cc',
          color: 'white',
          cursor: 'pointer',
          width: '200px',
          marginBottom: '20px'
        }}
      >
        See All Habits
      </button>
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