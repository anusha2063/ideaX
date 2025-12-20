import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = ({ coordinates, landslideData }) => {
    const mapRef = useRef(null);
    const leafletMapRef = useRef(null);
    const trailLayerRef = useRef(null);
    const landslideLayerRef = useRef(null);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return;

        // Create map centered on Langtang Valley, Nepal
        const map = L.map(mapRef.current, {
            center: [28.2134, 85.4293],
            zoom: 15,
            zoomControl: true,
        });

        // Add satellite tile layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 18,
        }).addTo(map);

        // Add labels overlay
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            maxZoom: 18,
            pane: 'shadowPane'
        }).addTo(map);

        // Add scale
        L.control.scale({ imperial: false, metric: true }).addTo(map);

        leafletMapRef.current = map;

        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, []);

    // Update Trail Line (Blue Dot Pattern)
    useEffect(() => {
        if (!leafletMapRef.current || !coordinates || coordinates.length === 0) {
            // Remove existing trail layer if no coordinates
            if (trailLayerRef.current) {
                if (trailLayerRef.current.animationInterval) {
                    clearInterval(trailLayerRef.current.animationInterval);
                }
                leafletMapRef.current.removeLayer(trailLayerRef.current);
                trailLayerRef.current = null;
            }
            return;
        }

        // Remove existing trail layer
        if (trailLayerRef.current) {
            if (trailLayerRef.current.animationInterval) {
                clearInterval(trailLayerRef.current.animationInterval);
            }
            leafletMapRef.current.removeLayer(trailLayerRef.current);
        }

        // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
        const latLngs = coordinates.map(coord => [coord[1], coord[0]]);

        // Blue dotted line for trail center
        const trailLine = L.polyline(latLngs, {
            color: '#007bff',     // Bright Blue
            weight: 4,
            opacity: 1.0,
            lineJoin: 'round',
            lineCap: 'round',
            dashArray: '1, 8',    // Distinct dot pattern
        });

        // Add a glow/surround for visibility
        const trailGlow = L.polyline(latLngs, {
            color: '#4fc3f7',     // Light Blue Glow
            weight: 8,
            opacity: 0.3,
            lineJoin: 'round',
            lineCap: 'round',
        });

        // Create layer group with all glow layers
        const trailGroup = L.layerGroup([trailGlow, trailLine]);
        trailGroup.addTo(leafletMapRef.current);
        trailLayerRef.current = trailGroup;

        // Add markers for start and end points
        if (latLngs.length > 0) {
            // Calculate trail distance
            let totalDistance = 0;
            for (let i = 1; i < latLngs.length; i++) {
                totalDistance += leafletMapRef.current.distance(latLngs[i - 1], latLngs[i]);
            }
            const distanceKm = (totalDistance / 1000).toFixed(2);

            // Start marker - Simple Dot (Green)
            const startMarker = L.circleMarker(latLngs[0], {
                radius: 6,
                fillColor: 'hsl(160, 85%, 45%)', // Bright Green
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).bindPopup("Start");
            startMarker.addTo(trailGroup);

            // End marker - Simple Dot (Red)
            const endMarker = L.circleMarker(latLngs[latLngs.length - 1], {
                radius: 8,
                fillColor: '#ff3333', // Red
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 1,
                className: 'pulse-marker-circle'
            }).bindPopup(`
                <div style="padding: 8px; text-align: center;">
                    <strong>Current Position</strong><br/>
                    <span style="font-size: 0.9em; opacity: 0.8;">${distanceKm} km</span>
                </div>
            `);
            endMarker.addTo(trailGroup);

            // Add distance waypoint markers every km
            let accumulatedDistance = 0;
            for (let i = 1; i < latLngs.length; i++) {
                const segmentDistance = leafletMapRef.current.distance(latLngs[i - 1], latLngs[i]);
                accumulatedDistance += segmentDistance;

                if (Math.floor(accumulatedDistance / 1000) > Math.floor((accumulatedDistance - segmentDistance) / 1000)) {
                    const kmMark = Math.floor(accumulatedDistance / 1000);
                    L.circleMarker(latLngs[i], {
                        radius: 6,
                        fillColor: 'hsl(45, 85%, 62%)',
                        color: 'hsl(160, 45%, 55%)',
                        weight: 2,
                        opacity: 0.9,
                        fillOpacity: 0.8
                    }).bindPopup(`
                        <div style="padding: 4px; text-align: center;">
                            <strong style="color: hsl(45, 85%, 62%);">${kmMark} km</strong>
                        </div>
                    `).addTo(trailGroup);
                }
            }
        }

        // Fit map to trail bounds
        if (latLngs.length > 1) {
            const bounds = L.latLngBounds(latLngs);
            leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [coordinates]);

    return (
        <div className="map-view-container">
            <div ref={mapRef} className="leaflet-map" />
            {coordinates.length === 0 && (
                <div className="map-overlay">
                    <div className="map-placeholder">
                        <span className="map-placeholder-icon">📍</span>
                        <p>Waiting for trail detection...</p>
                        <small>Start the stream to see detected trails</small>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapView;
