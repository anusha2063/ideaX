import React, { useState, useEffect } from 'react';
import './App.css';
import MapView from './components/MapView';

const API_BASE = 'http://localhost:5000';

function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [trailCoordinates, setTrailCoordinates] = useState([]);
  const [stats, setStats] = useState({
    pointsDetected: 0,
    trailLength: 0,
    lastUpdate: null
  });

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
        console.error('Backend check failed:', error);
        setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll for trail coordinates when streaming
  useEffect(() => {
    if (!isStreaming) return;

    const pollTrailData = async () => {
      try {
        const response = await fetch(`${API_BASE}/trail/geojson`);
        const data = await response.json();
        
        if (data.geometry && data.geometry.coordinates) {
          const coords = data.geometry.coordinates;
          setTrailCoordinates(coords);
          
          // Update stats
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

    pollTrailData();
    const interval = setInterval(pollTrailData, 1000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const calculateTrailLength = (coords) => {
    if (coords.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < coords.length; i++) {
      const [lon1, lat1] = coords[i - 1];
      const [lon2, lat2] = coords[i];
      
      // Haversine formula for distance
      const R = 6371e3; // Earth radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      
      totalDistance += R * c;
    }
    
    return (totalDistance / 1000).toFixed(2); // Convert to km
  };

  const handleStartStream = () => {
    setIsStreaming(true);
    setTrailCoordinates([]);
    setStats({ pointsDetected: 0, trailLength: 0, lastUpdate: null });
  };

  const handleStopStream = () => {
    setIsStreaming(false);
  };

  const handleResetMap = async () => {
    try {
      await fetch(`${API_BASE}/set_base_location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: 28.2134, lon: 85.4293 })
      });
      setTrailCoordinates([]);
      setStats({ pointsDetected: 0, trailLength: 0, lastUpdate: null });
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>🛸 SkyWeave</h1>
        <p>AI-Powered Drone Trail Detection & Mapping System</p>
      </header>

      {/* Main Content Grid */}
      <div className="main-grid">
        {/* Video Section */}
        <section className="video-section">
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-title-icon">📹</span>
                Drone Video Feed
              </h2>
              <div className="badge badge-success" style={{ opacity: backendStatus === 'online' ? 1 : 0.5 }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: backendStatus === 'online' ? 'var(--color-success)' : 'var(--color-danger)',
                  animation: backendStatus === 'online' ? 'pulse 1.5s ease-in-out infinite' : 'none'
                }}></div>
                {backendStatus === 'online' ? 'Backend Online' : 'Backend Offline'}
              </div>
            </div>

            <div className="video-container">
              {isStreaming ? (
                <>
                  <div className="stream-overlay">
                    <div className="live-indicator">
                      <div className="live-dot"></div>
                      LIVE
                    </div>
                  </div>
                  <img 
                    src={`${API_BASE}/stream`} 
                    alt="Drone stream" 
                    className="video-stream"
                  />
                </>
              ) : (
                <div className="video-placeholder">
                  <span className="video-placeholder-icon">🎥</span>
                  <p>Stream not active. Click "Start Detection" to begin.</p>
                </div>
              )}
            </div>

            <div className="controls">
              {!isStreaming ? (
                <button 
                  className="button button-primary" 
                  onClick={handleStartStream}
                  disabled={backendStatus !== 'online'}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}>▶️ Start Detection</span>
                </button>
              ) : (
                <button 
                  className="button button-danger" 
                  onClick={handleStopStream}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}>⏹️ Stop Stream</span>
                </button>
              )}
              <button 
                className="button button-success" 
                onClick={handleResetMap}
                disabled={backendStatus !== 'online'}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>🔄 Reset Map</span>
              </button>
            </div>

            {backendStatus === 'offline' && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <div>
                  <strong>Backend Offline</strong>
                  <br />
                  Make sure the Flask server is running on port 5000
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-title-icon">📊</span>
                Real-time Statistics
              </h2>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Trail Points</div>
                <div className="stat-value">{stats.pointsDetected}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Trail Length</div>
                <div className="stat-value">{stats.trailLength} km</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Last Update</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                  {stats.lastUpdate || '--:--:--'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="map-section">
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-title-icon">🗺️</span>
                Trail Map
              </h2>
              {isStreaming && (
                <div className="badge badge-warning">
                  <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>●</span>
                  Updating
                </div>
              )}
            </div>

            <MapView coordinates={trailCoordinates} />
          </div>

          {/* Info Panel */}
          <div className="info-panel">
            <h3>ℹ️ How It Works</h3>
            <ul>
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

export default App;
