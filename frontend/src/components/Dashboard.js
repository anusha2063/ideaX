import React, { useState, useEffect } from 'react';
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

  // ========== EFFECTS ==========
  
  /**
   * Effect: Backend Health Check
   * Periodically checks if the Flask backend is online and responding
   * Runs every 10 seconds to monitor connection status
   */
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();
        if (data.status === 'SkyWeave backend running') {
          setBackendStatus('online');
        }
      } catch (error) {
        console.error('Backend check failed:', error);
        setBackendStatus('offline');
      }
    };

    checkBackend();                                    // Initial check
    const interval = setInterval(checkBackend, 10000); // Check every 10 seconds
    return () => clearInterval(interval);              // Cleanup on unmount
  }, []);

  /**
   * Effect: Poll Trail Data
   * Fetches trail coordinates from backend when streaming is active
   * Updates every 1 second to show real-time trail progress
   */
  useEffect(() => {
    if (!isStreaming) return; // Only poll when streaming is active

    const pollTrailData = async () => {
      try {
        const response = await fetch(`${API_BASE}/trail/geojson`);
        const data = await response.json();
        
        if (data.geometry && data.geometry.coordinates) {
          const coords = data.geometry.coordinates;
          setTrailCoordinates(coords);
          
          // Update statistics with new trail data
          setStats({
            pointsDetected: coords.length,
            trailLength: calculateTrailLength(coords),
            lastUpdate: new Date().toLocaleTimeString()
          });
        }
      } catch (error) {
        console.error('Failed to fetch trail data:', error);
      }
    };

    pollTrailData();                                   // Initial fetch
    const interval = setInterval(pollTrailData, 1000); // Poll every 1 second
    return () => clearInterval(interval);              // Cleanup on unmount or when streaming stops
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
  const handleStartStream = () => {
    setIsStreaming(true);             // Enable streaming
    setTrailCoordinates([]);          // Clear previous trail data
    setStats({ pointsDetected: 0, trailLength: 0, lastUpdate: null }); // Reset statistics
  };

  /**
   * Handle Stop Stream
   * Stops the video stream (trail data remains visible)
   */
  const handleStopStream = () => {
    setIsStreaming(false);
  };

  /**
   * Handle Reset Map
   * Resets the map to default location and clears all trail data
   * Sends request to backend to reset base location
   */
  const handleResetMap = async () => {
    try {
      // Reset backend to default Langtang Valley coordinates
      await fetch(`${API_BASE}/set_base_location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: 28.2134, lon: 85.4293 })
      });
      
      // Clear frontend trail data and statistics
      setTrailCoordinates([]);
      setStats({ pointsDetected: 0, trailLength: 0, lastUpdate: null });
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  };

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
                  alt="Drone stream" 
                  className="video-stream"
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
                  disabled={backendStatus !== 'online'}
                  title="Start video stream and trail detection"
                >
                  <span><FaPlay /> Start Detection</span>
                </button>
              ) : (
                <button 
                  className="button button-danger" 
                  onClick={handleStopStream}
                  title="Stop video stream"
                >
                  <span><FaStop /> Stop Stream</span>
                </button>
              )}
              
              {/* Reset Button */}
              <button 
                className="button button-secondary" 
                onClick={handleResetMap}
                disabled={backendStatus !== 'online'}
                title="Reset map and clear trail data"
              >
                <span><FaSync /> Reset Map</span>
              </button>
            </div>

            {/* Error Message (shown when backend is offline) */}
            {backendStatus === 'offline' && (
              <div className="error-message">
                <span className="error-icon"><FaExclamationTriangle /></span>
                <div>
                  <strong>Backend Offline</strong>
                  <br />
                  Make sure the Flask server is running on port 5000
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
