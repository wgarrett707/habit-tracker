import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

interface Habit {
  id: number;
  name: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    fetchHabits();
    // Get username from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.username);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  const fetchHabits = async () => {
    try {
      const data = await api.get('/habits');
      
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
        const newHabit = await api.post('/habits', { name: name.trim() });
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
        await api.delete(`/habits/${id}`);
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
      <div style={{ 
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 1000
      }}>
        <span style={{ color: 'white' }}>{username}</span>
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }}
          style={{
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            padding: '8px 16px'
          }}
        >
          Logout
        </button>
      </div>

      <h1 style={{ color: 'white', marginBottom: '20px' }}>My Habits</h1>

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