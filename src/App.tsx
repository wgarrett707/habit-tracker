import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Habit from './pages/Habit';
import AllHabits from './pages/AllHabits';
import Login from './pages/Login';
import './styles/global.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/habits/:id" element={
          <ProtectedRoute>
            <Habit />
          </ProtectedRoute>
        } />
        <Route path="/all-habits" element={
          <ProtectedRoute>
            <AllHabits />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App
