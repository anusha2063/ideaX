import React from 'react';
import { FaHelicopter, FaRobot, FaMapMarkerAlt, FaVideo, FaChartLine } from 'react-icons/fa';
import './Footer.css';

/**
 * Footer Component
 * Site footer with branding and features list
 */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section footer-brand-section">
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
          <div className="footer-section footer-features-section">
            <h4 className="footer-heading">Features</h4>
            <ul className="footer-links">
              <li><FaRobot className="footer-icon" /> Real-time AI Detection</li>
              <li><FaMapMarkerAlt className="footer-icon" /> GPS Trail Mapping</li>
              <li><FaVideo className="footer-icon" /> Live Video Stream</li>
              <li><FaChartLine className="footer-icon" /> Analytics Dashboard</li>
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
  );
}

export default Footer;
