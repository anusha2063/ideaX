/**
 * API service for backend communication
 */

import { API_BASE_URL } from '../constants/config';

export const api = {
  /**
   * Check backend status
   */
  checkStatus: async (signal) => {
    const response = await fetch(`${API_BASE_URL}/`, {
      signal,
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Backend check failed: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Get trail GeoJSON data
   */
  getTrailData: async (signal) => {
    const response = await fetch(`${API_BASE_URL}/trail/geojson`, {
      signal,
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch trail data: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Set base location for trail mapping
   */
  setBaseLocation: async (lat, lon) => {
    const response = await fetch(`${API_BASE_URL}/set_base_location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ lat, lon })
    });
    if (!response.ok) {
      throw new Error(`Failed to set base location: ${response.status}`);
    }
    return response.json();
  },
};
