import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import './ThemeToggle.css';

/**
 * ThemeToggle Component
 * Toggle button to switch between dark and light themes
 * Persists theme preference in localStorage
 */
const ThemeToggle = () => {
    const [theme, setTheme] = useState(() => {
        // Get saved theme from localStorage or default to 'dark'
        return localStorage.getItem('theme') || 'dark';
    });

    useEffect(() => {
        // Apply theme to body element
        document.body.setAttribute('data-theme', theme);
        // Save theme preference
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <div className="theme-toggle-track">
                <div className={`theme-toggle-thumb ${theme}`}>
                    {theme === 'dark' ? (
                        <FaMoon className="theme-icon" />
                    ) : (
                        <FaSun className="theme-icon" />
                    )}
                </div>
            </div>
            <span className="theme-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
    );
};

export default ThemeToggle;
