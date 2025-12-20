import React from 'react';
import { FaHelicopter } from 'react-icons/fa';
import './Footer.css';

/**
 * Footer Component
 * Site footer with branding
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
