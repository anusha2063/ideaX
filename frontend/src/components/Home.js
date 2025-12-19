import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaMap, FaVideo, FaChartBar, FaMountain, FaTree, FaHelicopter, FaCampground, FaArrowRight, FaPlay } from 'react-icons/fa';
import './Home.css';

/**
 * Home Component
 * Landing page that introduces SkyWeave and its features
 * 
 * Purpose:
 * - Welcome new users with an overview of the system
 * - Highlight key features and capabilities
 * - Provide call-to-action to access the dashboard
 * - Showcase technology stack and use cases
 */
const Home = () => {
    const navigate = useNavigate();

    /**
     * Navigate to Dashboard
     * Redirects user to the main application dashboard
     */
    const goToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="home-page">
            {/* ==================== HERO SECTION ==================== */}
            <section className="home-hero">
                <div className="hero-background">
                    <div className="hero-gradient"></div>
                    <div className="hero-pattern"></div>
                </div>
                
                <div className="hero-container">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        AI-Powered Detection System
                    </div>
                    
                    <h1 className="hero-main-title">
                        Discover & Map Trails
                        <br />
                        <span className="gradient-text">From The Sky</span>
                    </h1>
                    
                    <p className="hero-description">
                        Advanced AI-powered drone system that detects and maps hiking trails in real-time. 
                        Perfect for exploration, conservation, and adventure mapping.
                    </p>
                    
                    <div className="hero-actions">
                        <button className="cta-button primary" onClick={goToDashboard}>
                            <span>Launch Dashboard</span>
                            <span className="button-icon"><FaArrowRight /></span>
                        </button>
                        <button className="cta-button secondary">
                            <span>Watch Demo</span>
                            <span className="button-icon"><FaPlay /></span>
                        </button>
                    </div>
                    
                    <div className="hero-stats">
                        <div className="stat-item">
                            <div className="stat-value">Real-time</div>
                            <div className="stat-label">Detection</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">YOLO v8</div>
                            <div className="stat-label">AI Model</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">GPS</div>
                            <div className="stat-label">Precision</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== FEATURES SECTION ==================== */}
            <section className="features-section">
                <div className="section-container">
                    <div className="section-header-center">
                        <h2 className="section-title">Powerful Features</h2>
                        <p className="section-subtitle">
                            Everything you need for intelligent trail detection and mapping
                        </p>
                    </div>

                    <div className="features-grid">
                        {/* Feature 1 */}
                        <div className="feature-card">
                            <div className="feature-icon"><FaRobot /></div>
                            <h3 className="feature-title">AI Detection</h3>
                            <p className="feature-description">
                                YOLO v8 neural network identifies hiking trails with high accuracy 
                                from drone footage in real-time.
                            </p>
                            <ul className="feature-list">
                                <li>Real-time processing</li>
                                <li>High accuracy detection</li>
                                <li>Adaptive learning</li>
                            </ul>
                        </div>

                        {/* Feature 2 */}
                        <div className="feature-card">
                            <div className="feature-icon"><FaMap /></div>
                            <h3 className="feature-title">Live Mapping</h3>
                            <p className="feature-description">
                                Instantly visualize detected trails on interactive satellite maps 
                                with GPS coordinates and trail metrics.
                            </p>
                            <ul className="feature-list">
                                <li>Satellite imagery</li>
                                <li>Interactive controls</li>
                                <li>Trail statistics</li>
                            </ul>
                        </div>

                        {/* Feature 3 */}
                        <div className="feature-card">
                            <div className="feature-icon"><FaVideo /></div>
                            <h3 className="feature-title">Video Stream</h3>
                            <p className="feature-description">
                                Watch live drone footage with AI detection overlays showing 
                                identified trails and confidence scores.
                            </p>
                            <ul className="feature-list">
                                <li>HD video quality</li>
                                <li>Detection overlays</li>
                                <li>Stream controls</li>
                            </ul>
                        </div>

                        {/* Feature 4 */}
                        <div className="feature-card">
                            <div className="feature-icon"><FaChartBar /></div>
                            <h3 className="feature-title">Analytics</h3>
                            <p className="feature-description">
                                Track trail length, detection points, and real-time statistics 
                                for comprehensive trail analysis.
                            </p>
                            <ul className="feature-list">
                                <li>Distance calculation</li>
                                <li>Point tracking</li>
                                <li>Time-stamped data</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== HOW IT WORKS SECTION ==================== */}
            <section className="how-it-works-section">
                <div className="section-container">
                    <div className="section-header-center">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">
                            Simple, powerful, and intelligent trail detection in four steps
                        </p>
                    </div>

                    <div className="steps-container">
                        {/* Step 1 */}
                        <div className="step-card">
                            <div className="step-number">01</div>
                            <div className="step-content">
                                <h3 className="step-title">Capture</h3>
                                <p className="step-description">
                                    Drone captures high-resolution video footage of terrain 
                                    while flying over potential trail areas.
                                </p>
                            </div>
                            <div className="step-icon"><FaVideo /></div>
                        </div>

                        {/* Step 2 */}
                        <div className="step-card">
                            <div className="step-number">02</div>
                            <div className="step-content">
                                <h3 className="step-title">Detect</h3>
                                <p className="step-description">
                                    YOLO AI model analyzes each frame in real-time to identify 
                                    and classify hiking trails with confidence scores.
                                </p>
                            </div>
                            <div className="step-icon"><FaRobot /></div>
                        </div>

                        {/* Step 3 */}
                        <div className="step-card">
                            <div className="step-number">03</div>
                            <div className="step-content">
                                <h3 className="step-title">Map</h3>
                                <p className="step-description">
                                    GPS coordinates are extracted and plotted on an interactive 
                                    map with satellite imagery overlay.
                                </p>
                            </div>
                            <div className="step-icon"><FaMap /></div>
                        </div>

                        {/* Step 4 */}
                        <div className="step-card">
                            <div className="step-number">04</div>
                            <div className="step-content">
                                <h3 className="step-title">Analyze</h3>
                                <p className="step-description">
                                    View comprehensive statistics including trail length, 
                                    detection points, and real-time updates.
                                </p>
                            </div>
                            <div className="step-icon"><FaChartBar /></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== USE CASES SECTION ==================== */}
            <section className="use-cases-section">
                <div className="section-container">
                    <div className="section-header-center">
                        <h2 className="section-title">Use Cases</h2>
                        <p className="section-subtitle">
                            Versatile applications for various industries and purposes
                        </p>
                    </div>

                    <div className="use-cases-grid">
                        <div className="use-case-card">
                            <div className="use-case-emoji"><FaMountain /></div>
                            <h3>Exploration</h3>
                            <p>Discover unmapped trails in remote wilderness areas</p>
                        </div>
                        <div className="use-case-card">
                            <div className="use-case-emoji"><FaTree /></div>
                            <h3>Conservation</h3>
                            <p>Monitor and protect natural trails and wildlife corridors</p>
                        </div>
                        <div className="use-case-card">
                            <div className="use-case-emoji"><FaHelicopter /></div>
                            <h3>Search & Rescue</h3>
                            <p>Quickly map accessible routes in emergency situations</p>
                        </div>
                        <div className="use-case-card">
                            <div className="use-case-emoji"><FaCampground /></div>
                            <h3>Tourism</h3>
                            <p>Create detailed trail maps for hiking and adventure tourism</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== CTA SECTION ==================== */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2 className="cta-title">Ready to Start Mapping?</h2>
                    <p className="cta-description">
                        Access the full dashboard and start detecting trails in real-time
                    </p>
                    <button className="cta-button-large" onClick={goToDashboard}>
                        <span>Go to Dashboard</span>
                        <span className="button-arrow"><FaArrowRight /></span>
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Home;
