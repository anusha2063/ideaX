import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import MapView from './MapView';
import { FaVideo, FaChartLine, FaMap, FaInfoCircle, FaMapMarkerAlt, FaRuler, FaClock, FaPlay, FaStop, FaSync, FaExclamationTriangle, FaCamera } from 'react-icons/fa';

/**
 * API Configuration
 * Base URL for the backend Flask server
 */
const API_BASE = 'http://localhost:5000';

/**
 * Dashboard Component
 * Main application dashboard that manages drone trail detection and visualization
 * 
 * Features:
 * - Real-time video stream from drone
 * - Interactive map showing detected trails
 * - Statistics dashboard
 * - Backend health monitoring
 * - Stream controls
 */
function Dashboard() {
  // ========== STATE MANAGEMENT ==========
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);           // Whether video stream is active
  
  // Backend connection state
  const [backendStatus, setBackendStatus] = useState('checking');  // 'checking' | 'online' | 'offline'
  
  // Trail data state
  const [trailCoordinates, setTrailCoordinates] = useState([]);    // Array of [lon, lat] coordinates
  
  // Statistics state
  const [stats, setStats] = useState({
    pointsDetected: 0,        // Number of trail points detected
    trailLength: 0,           // Total trail length in km
    lastUpdate: null          // Timestamp of last data update
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);     // Loading indicator
  const [error, setError] = useState(null);              // Error message

  // ========== EFFECTS ==========
  
  /**
   * Effect: Backend Health Check
   * Periodically checks if the Flask backend is online and responding
   * Runs every 10 seconds to monitor connection status
   */
  useEffect(() => {
    const abortController = new AbortController();
    
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE}/`, {
          signal: abortController.signal,
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === 'SkyWeave backend running') {
          setBackendStatus('online');
          setError(null); // Clear any previous errors
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Backend check failed:', error);
          setBackendStatus('offline');
        }
      }
    };

    checkBackend();                                    // Initial check
    const interval = setInterval(checkBackend, 10000); // Check every 10 seconds
    return () => {
      clearInterval(interval);
      abortController.abort(); // Cancel pending requests
    };
  }, []);

  /**
   * Effect: Poll Trail Data
   * Fetches trail coordinates from backend when streaming is active
   * Updates every 1 second to show real-time trail progress
   */
  useEffect(() => {
    if (!isStreaming) return; // Only poll when streaming is active
    
    const abortController = new AbortController();

    const pollTrailData = async () => {
      try {
        const response = await fetch(`${API_BASE}/trail/geojson`, {
          signal: abortController.signal,
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch trail data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate coordinate data
        if (data.geometry && Array.isArray(data.geometry.coordinates)) {
          const coords = data.geometry.coordinates;
          
          // Validate each coordinate pair
          const validCoords = coords.filter(coord => 
            Array.isArray(coord) && 
            coord.length === 2 && 
            typeof coord[0] === 'number' && 
            typeof coord[1] === 'number' &&
            !isNaN(coord[0]) && !isNaN(coord[1])
          );
          
          setTrailCoordinates(validCoords);
          
          // Update statistics with new trail data
          setStats({
            pointsDetected: validCoords.length,
            trailLength: calculateTrailLength(validCoords),
            lastUpdate: new Date().toLocaleTimeString()
          });
          
          setError(null); // Clear any previous errors
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch trail data:', error);
          setError('Unable to fetch trail data. Please check your connection.');
        }
      }
    };

    pollTrailData();                                   // Initial fetch
    const interval = setInterval(pollTrailData, 2000); // Poll every 2 seconds (optimized)
    return () => {
      clearInterval(interval);
      abortController.abort(); // Cancel pending requests
    };
  }, [isStreaming]);

  // ========== UTILITY FUNCTIONS ==========
  
  /**
   * Calculate Trail Length
   * Uses the Haversine formula to calculate the total distance between trail points
   * 
   * @param {Array} coords - Array of [longitude, latitude] coordinate pairs
   * @returns {string} Total distance in kilometers (2 decimal places)
   */
  const calculateTrailLength = (coords) => {
    if (coords.length < 2) return 0; // Need at least 2 points for a distance
    
    let totalDistance = 0;
    
    // Calculate distance between each consecutive pair of points
    for (let i = 1; i < coords.length; i++) {
      const [lon1, lat1] = coords[i - 1];
      const [lon2, lat2] = coords[i];
      
      // Haversine formula for calculating distance between two GPS coordinates
      const R = 6371e3;                        // Earth's radius in meters
      const φ1 = lat1 * Math.PI / 180;         // Latitude 1 in radians
      const φ2 = lat2 * Math.PI / 180;         // Latitude 2 in radians
      const Δφ = (lat2 - lat1) * Math.PI / 180; // Difference in latitude
      const Δλ = (lon2 - lon1) * Math.PI / 180; // Difference in longitude
      
      // Haversine formula calculation
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      
      totalDistance += R * c; // Add segment distance
    }
    
    return (totalDistance / 1000).toFixed(2); // Convert meters to km
  };

  // ========== EVENT HANDLERS ==========
  
  /**
   * Handle Start Stream
   * Initiates the video stream and resets all trail data
   */
  const handleStartStream = useCallback(() => {
    if (backendStatus !== 'online') return;
    
    setIsLoading(true);
    setError(null);
    setIsStreaming(true);             // Enable streaming
    setTrailCoordinates([]);          // Clear previous trail data
    setStats({ pointsDetected: 0, trailLength: 0, lastUpdate: null }); // Reset statistics
    
    // Clear loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000);
  }, [backendStatus]);

  /**
   * Handle Stop Stream
   * Stops the video stream (trail data remains visible)
   */
  const handleStopStream = useCallback(() => {
    setIsStreaming(false);
  }, []);

  /**
   * Handle Reset Map
   * Resets the map to default location and clears all trail data
   * Sends request to backend to reset base location
   */
  const handleResetMap = useCallback(async () => {
    if (backendStatus !== 'online') return;
    
    // Confirm if there's data to lose
    if (trailCoordinates.length > 0) {
      const confirmed = window.confirm(
        `Reset map and clear ${trailCoordinates.length} trail points?`
      );
      if (!confirmed) return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Reset backend to default Langtang Valley coordinates
      const response = await fetch(`${API_BASE}/set_base_location`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ lat: 28.2134, lon: 85.4293 })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset map on backend');
      }
      
      // Clear frontend trail data and statistics
      setTrailCoordinates([]);
      setStats({ pointsDetected: 0, trailLength: 0, lastUpdate: null });
    } catch (error) {
      console.error('Failed to reset:', error);
      setError('Failed to reset map. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [backendStatus, trailCoordinates.length]);

  // ========== KEYBOARD SHORTCUTS ==========
  
  /**
   * Effect: Keyboard Shortcuts
   * Space: Toggle stream, Ctrl+R: Reset map
   */
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space' && backendStatus === 'online') {
        e.preventDefault();
        if (isStreaming) {
          handleStopStream();
        } else {
          handleStartStream();
        }
      } else if (e.key === 'r' && e.ctrlKey && backendStatus === 'online') {
        e.preventDefault();
        handleResetMap();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isStreaming, backendStatus, handleStartStream, handleStopStream, handleResetMap]);

  // ========== RENDER ==========
  
  return (
    <div className="dashboard">
      {/* ==================== DASHBOARD HEADER ==================== */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1 className="dashboard-title">Control Center</h1>
          <p className="dashboard-subtitle">Monitor and control drone trail detection</p>
        </div>
        
        {/* Backend Status Indicator */}
        <div className={`status-indicator ${backendStatus}`}>
          <div className="status-dot"></div>
          <div className="status-info">
            <span className="status-label">Backend</span>
            <span className="status-value">
              {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="dashboard-grid">
        {/* ========== LEFT COLUMN: Video & Stats ========== */}
        <section className="dashboard-section">
          {/* Video Feed Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-icon"><FaVideo /></span>
                Drone Video Feed
              </h2>
              {isStreaming && (
                <div className="live-badge">
                  <div className="live-dot"></div>
                  LIVE
                </div>
              )}
            </div>

            {/* Video Stream Container */}
            <div className="video-container">
              {isStreaming ? (
                /* Video stream from backend */
                <img 
                  src={`${API_BASE}/stream`} 
                  alt="Live drone video stream showing trail detection" 
                  className="video-stream"
                  loading="lazy"
                />
              ) : (
                /* Placeholder when not streaming */
                <div className="video-placeholder">
                  <span className="placeholder-icon"><FaCamera /></span>
                  <p>Stream not active</p>
                  <small>Click "Start Detection" to begin</small>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="controls">
              {/* Start/Stop Detection Button */}
              {!isStreaming ? (
                <button 
                  className="button button-primary" 
                  onClick={handleStartStream}
                  disabled={backendStatus !== 'online' || isLoading}
                  title="Start video stream and trail detection (Space)"
                  aria-label="Start trail detection"
                >
                  <span><FaPlay /> {isLoading ? 'Starting...' : 'Start Detection'}</span>
                </button>
              ) : (
                <button 
                  className="button button-danger" 
                  onClick={handleStopStream}
                  disabled={isLoading}
                  title="Stop video stream (Space)"
                  aria-label="Stop video stream"
                >
                  <span><FaStop /> Stop Stream</span>
                </button>
              )}
              
              {/* Reset Button */}
              <button 
                className="button button-secondary" 
                onClick={handleResetMap}
                disabled={backendStatus !== 'online' || isLoading}
                title="Reset map and clear trail data (Ctrl+R)"
                aria-label="Reset map and clear trail data"
              >
                <span><FaSync /> {isLoading ? 'Resetting...' : 'Reset Map'}</span>
              </button>
            </div>

            {/* Error Messages */}
            {backendStatus === 'offline' && (
              <div className="error-message" role="alert">
                <span className="error-icon"><FaExclamationTriangle /></span>
                <div>
                  <strong>Backend Offline</strong>
                  <br />
                  Make sure the Flask server is running on port 5000
                </div>
              </div>
            )}
            
            {error && backendStatus === 'online' && (
              <div className="error-message" role="alert">
                <span className="error-icon"><FaExclamationTriangle /></span>
                <div>
                  <strong>Error</strong>
                  <br />
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Statistics Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-icon"><FaChartLine /></span>
                Real-time Statistics
              </h2>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><FaMapMarkerAlt /></div>
                <div className="stat-content">
                  <div className="stat-label">Trail Points</div>
                  <div className="stat-value">{stats.pointsDetected}</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon"><FaRuler /></div>
                <div className="stat-content">
                  <div className="stat-label">Trail Length</div>
                  <div className="stat-value">{stats.trailLength} <span className="stat-unit">km</span></div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon"><FaClock /></div>
                <div className="stat-content">
                  <div className="stat-label">Last Update</div>
                  <div className="stat-value stat-time">
                    {stats.lastUpdate || '--:--:--'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== RIGHT COLUMN: Map & Info ========== */}
        <section className="dashboard-section">
          {/* Map Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-icon"><FaMap /></span>
                Trail Map
              </h2>
              {/* Updating indicator (shown when streaming) */}
              {isStreaming && (
                <div className="updating-badge">
                  <span className="updating-dot">●</span>
                  Updating
                </div>
              )}
            </div>

            {/* Interactive Map Component */}
            <MapView coordinates={trailCoordinates} />
          </div>

          {/* Info Panel */}
          <div className="info-panel">
            <h3 className="info-title">
              <span className="info-icon"><FaInfoCircle /></span>
              How It Works
            </h3>
            <ul className="info-list">
              <li>YOLO AI detects hiking trails in real-time drone footage</li>
              <li>GPS coordinates are mapped for each detected trail segment</li>
              <li>Trail data is visualized on an interactive map</li>
              <li>Perfect for mapping unexplored terrain and hiking routes</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
