import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import MapView from '../MapView';
import { FaVideo, FaChartLine, FaMap, FaInfoCircle, FaMapMarkerAlt, FaRuler, FaClock, FaPlay, FaStop, FaSync, FaExclamationTriangle, FaCamera, FaTachometerAlt, FaExpand, FaHourglassHalf, FaMountain, FaRoute } from 'react-icons/fa';

/**
 * API Configuration (Kept for backward compatibility)
 * Base URL for the backend Flask server
 */
const API_BASE = 'http://localhost:5000';

/**
 * Dashboard Component
 * Main application dashboard that manages combined drone trail and landslide detection
 */
function Dashboard() {
  // ========== STATE MANAGEMENT ==========

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);           // Whether video stream is active

  // Backend connection state
  const [backendStatus, setBackendStatus] = useState('checking');  // 'checking' | 'online' | 'offline'

  // Trail data state
  const [trailCoordinates, setTrailCoordinates] = useState([]);    // Array of [lon, lat] coordinates

  // Landslide/Segmentation data state
  const [landslideData, setLandslideData] = useState([]);          // Array of polygons

  // Statistics state
  const [stats, setStats] = useState({
    trailPoints: 0,           // Number of trail points
    landslideCount: 0,        // Number of landslide polygons
    trailLength: 0,           // Total trail length in km
    lastUpdate: null,         // Timestamp of last data update
    avgSpeed: 0,              // Average speed in km/h
    streamDuration: 0         // Streaming duration in seconds
  });

  // Stream start time for duration calculation
  const [streamStartTime, setStreamStartTime] = useState(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);     // Loading indicator
  const [error, setError] = useState(null);              // Error message

  // ========== EFFECTS ==========

  /**
   * Effect: Backend Health Check
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

    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, []);

  /**
   * Effect: Poll Data (Combined)
   */
  useEffect(() => {
    if (!isStreaming) return;

    const abortController = new AbortController();

    const pollData = async () => {
      try {
        // Fetch BOTH endpoints in parallel
        const [trailRes, landslideRes] = await Promise.all([
          fetch(`${API_BASE}/trail/geojson`, { signal: abortController.signal }),
          fetch(`${API_BASE}/landslide/geojson`, { signal: abortController.signal })
        ]);

        let newTrailCoords = [];
        let newLandslidePolys = [];

        // Process Trail Data
        if (trailRes.ok) {
          const data = await trailRes.json();
          if (data.geometry && Array.isArray(data.geometry.coordinates)) {
            newTrailCoords = data.geometry.coordinates.filter(coord =>
              Array.isArray(coord) && coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1])
            );
          }
        }

        // Process Landslide Data
        if (landslideRes.ok) {
          const data = await landslideRes.json();
          if (data.type === 'FeatureCollection') {
            newLandslidePolys = data.features.map(f => f.geometry.coordinates[0]);
          } else if (data.geometry) {
            newLandslidePolys = [data.geometry.coordinates]; // Should technically be list of polys
          }
        }

        // Update State
        setTrailCoordinates(newTrailCoords);
        setLandslideData(newLandslidePolys);

        // Update Statistics
        updateStats(newTrailCoords, newLandslidePolys);
        setError(null);

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch data:', error);
        }
      }
    };

    pollData();
    const interval = setInterval(pollData, 1000);
    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, [isStreaming, streamStartTime]);

  // ========== HELPER FUNCTIONS ==========

  const updateStats = (coords, polygons) => {
    const duration = streamStartTime ? Math.floor((Date.now() - streamStartTime) / 1000) : 0;
    const trailLength = calculateTrailLength(coords);

    setStats({
      trailPoints: coords.length,
      landslideCount: polygons.length,
      trailLength: trailLength,
      lastUpdate: new Date().toLocaleTimeString(),
      avgSpeed: duration > 0 ? ((trailLength / duration) * 3600).toFixed(1) : 0,
      streamDuration: duration
    });
  };

  const calculateTrailLength = (coords) => {
    if (!coords || coords.length < 2) return 0;
    let totalDistance = 0;
    for (let i = 1; i < coords.length; i++) {
      totalDistance += calculateDistance(coords[i - 1], coords[i]);
    }
    return (totalDistance / 1000).toFixed(2);
  };

  const calculateDistance = (coord1, coord2) => {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ========== EVENT HANDLERS ==========

  const handleStartStream = useCallback(() => {
    if (backendStatus !== 'online') return;

    setIsLoading(true);
    setError(null);
    setIsStreaming(true);
    setStreamStartTime(Date.now());

    // Reset data on start
    setTrailCoordinates([]);
    setLandslideData([]);
    setStats({ trailPoints: 0, landslideCount: 0, trailLength: 0, lastUpdate: null, avgSpeed: 0, streamDuration: 0 });

    setTimeout(() => setIsLoading(false), 1000);
  }, [backendStatus]);

  const handleStopStream = useCallback(() => {
    setIsStreaming(false);
    setStreamStartTime(null);
  }, []);

  const handleResetMap = useCallback(async () => {
    if (backendStatus !== 'online') return;

    setIsLoading(true);
    setError(null);

    try {
      await fetch(`${API_BASE}/set_base_location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ lat: 28.2134, lon: 85.4293 })
      });

      setTrailCoordinates([]);
      setLandslideData([]);
      setStreamStartTime(null);
      setStats({ trailPoints: 0, landslideCount: 0, trailLength: 0, lastUpdate: null, avgSpeed: 0, streamDuration: 0 });
    } catch (error) {
      console.error('Failed to reset:', error);
      setError('Failed to reset map. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [backendStatus]);

  // ========== RENDER ==========

  return (
    <div className="dashboard">
      {/* ==================== DASHBOARD HEADER ==================== */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1 className="dashboard-title">Control Center</h1>
          <p className="dashboard-subtitle">Combined Drone Trail & Landslide Detection</p>
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
        {/* ========== TOP ROW: Video & Map ========== */}
        <section className="dashboard-section dashboard-top-row">
          {/* Video Feed Card */}
          <div className="dashboard-card dashboard-video-card">
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
                  alt="Live drone video stream"
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
                  title="Start video stream"
                >
                  <span><FaPlay /> {isLoading ? 'Starting...' : 'Start Detection'}</span>
                </button>
              ) : (
                <button
                  className="button button-danger"
                  onClick={handleStopStream}
                  disabled={isLoading}
                  title="Stop video stream"
                >
                  <span><FaStop /> Stop Stream</span>
                </button>
              )}

              {/* Reset Button */}
              <button
                className="button button-secondary"
                onClick={handleResetMap}
                disabled={backendStatus !== 'online' || isLoading}
                title="Reset map"
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
          </div>

          {/* Map Card */}
          <div className="dashboard-card dashboard-map-card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-icon"><FaMap /></span>
                Trail & Landslide Map
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
            <MapView coordinates={trailCoordinates} landslideData={landslideData} />
          </div>
        </section>

        {/* ========== BOTTOM ROW: Statistics ========== */}
        <section className="dashboard-section dashboard-stats-row">
          {/* Statistics Card */}
          <div className="dashboard-card dashboard-stats-card">
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
                  <div className="stat-value">{stats.trailPoints}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"><FaMountain /></div>
                <div className="stat-content">
                  <div className="stat-label">Landslides</div>
                  <div className="stat-value">{stats.landslideCount}</div>
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
                <div className="stat-icon"><FaTachometerAlt /></div>
                <div className="stat-content">
                  <div className="stat-label">Avg Speed</div>
                  <div className="stat-value">{stats.avgSpeed} <span className="stat-unit">km/h</span></div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"><FaHourglassHalf /></div>
                <div className="stat-content">
                  <div className="stat-label">Duration</div>
                  <div className="stat-value stat-time">
                    {formatDuration(stats.streamDuration)}
                  </div>
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
      </div>
    </div>
  );
}

export default Dashboard;
