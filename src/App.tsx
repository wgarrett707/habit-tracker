import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Habit from './pages/Habit';
import AllHabits from './pages/AllHabits';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/habits/:id" element={<Habit />} />
        <Route path="/all-habits" element={<AllHabits />} />
      </Routes>
    </Router>
  )
}

export default App
