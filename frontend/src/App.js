import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import ThemeToggle from './components/ThemeToggle';
import { FaHelicopter, FaCircle, FaHeart, FaCode, FaGithub, FaHome, FaChartLine, FaRobot, FaMapMarkerAlt, FaVideo } from 'react-icons/fa';

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
          <FaHelicopter className="brand-icon" />
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
        
        <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            {/* Brand Section */}
            <div className="footer-section">
              <div className="footer-brand">
                <FaHelicopter className="footer-brand-icon" />
                <h3 className="footer-brand-name">SkyWeave</h3>
              </div>
              <p className="footer-description">
                AI-powered drone trail detection and mapping system for exploration, 
                conservation, and adventure mapping.
              </p>
            </div>

            {/* Features */}
            <div className="footer-section">
              <h4 className="footer-heading">Features</h4>
              <ul className="footer-links">
                <li><FaRobot className="footer-icon" /> Real-time AI Detection</li>
                <li><FaMapMarkerAlt className="footer-icon" /> GPS Trail Mapping</li>
                <li><FaVideo className="footer-icon" /> Live Video Stream</li>
                <li><FaChartLine className="footer-icon" /> Analytics Dashboard</li>
              </ul>
            </div>

            {/* Technology */}
            <div className="footer-section">
              <h4 className="footer-heading">Technology</h4>
              <ul className="footer-links">
                <li>YOLO v8 AI Model</li>
                <li>React Frontend</li>
                <li>Flask Backend</li>
                <li>Leaflet Maps</li>
              </ul>
            </div>

            {/* Links */}
            <div className="footer-section">
              <h4 className="footer-heading">Resources</h4>
              <ul className="footer-links">
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#github">GitHub</a></li>
                <li><a href="#api">API Reference</a></li>
                <li><a href="#support">Support</a></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2025 SkyWeave. Built with purpose|| for innovation.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </Router>
  );
}

export default App;
