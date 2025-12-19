import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';
import Home from './components/features/Home';
import Dashboard from './components/features/Dashboard';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

/**
 * App Component
 * Main application with routing
 */
function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
