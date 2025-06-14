import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';

const Habit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habitColor, setHabitColor] = useState('#0066cc');

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
        <input
          type="color"
          value={habitColor}
          onChange={(e) => setHabitColor(e.target.value)}
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
      <h1 style={{ color: habitColor, marginBottom: '20px' }}>Habit {id}</h1>
      <Calendar selectedColor={habitColor} />
    </div>
  );
};

export default Habit; 