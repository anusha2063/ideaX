import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../../common/ThemeToggle';
import { FaCircle, FaHome, FaChartLine } from 'react-icons/fa';
import './Navbar.css';

const API_BASE = 'http://localhost:5000';

/**
 * Navbar Component
 * Navigation bar that appears on all pages
 */
function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend health
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();
        if (data.status === 'SkyWeave backend running') {
          setBackendStatus('online');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <img src="/favicon.png" alt="SkyWeave" className="brand-icon" />
          <div className="brand-text">
            <span className="brand-name">SkyWeave</span>
            <span className="brand-tagline">AI Trail Detection</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="navbar-menu">
          <button 
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <FaHome />
            <span>Home</span>
          </button>
          <button 
            className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <FaChartLine />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="navbar-theme">
          <ThemeToggle />
        </div>

        {/* Status */}
        <div className="navbar-status">
          <div className={`status-badge status-${backendStatus}`}>
            <FaCircle className="status-dot" />
            <span className="status-text">
              {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
