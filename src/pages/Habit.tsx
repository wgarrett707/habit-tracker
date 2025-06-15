import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';

interface Habit {
  id: number;
  name: string;
  color: string;
}

const Habit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabit();
  }, [id]);

  const fetchHabit = async () => {
    try {
      const response = await fetch(`http://localhost:3000/habits/${id}`);
      const data = await response.json();
      setHabit(data);
    } catch (error) {
      console.error('Error fetching habit:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateColor = async (color: string) => {
    try {
      await fetch(`http://localhost:3000/habits/${id}/color`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color })
      });
      setHabit(prev => prev ? { ...prev, color } : null);
    } catch (error) {
      console.error('Error updating color:', error);
    }
  };

  if (loading) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
        <h1 style={{ color: habit?.color || '#0066cc' }}>{habit?.name || 'Loading...'}</h1>
        <input
          type="color"
          value={habit?.color || '#0066cc'}
          onChange={(e) => updateColor(e.target.value)}
          style={{
            width: '30px',
            height: '30px',
            padding: '0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        />
      </div>
      <Calendar selectedColor={habit?.color || '#0066cc'} habitId={Number(id)} />
    </div>
  );
};

export default Habit; 