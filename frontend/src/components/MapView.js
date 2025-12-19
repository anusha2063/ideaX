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

const MapView = ({ coordinates }) => {
    const mapRef = useRef(null);
    const leafletMapRef = useRef(null);
    const trailLayerRef = useRef(null);

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

    // Update trail on map
    useEffect(() => {
        if (!leafletMapRef.current || !coordinates || coordinates.length === 0) {
            // Remove existing trail layer if no coordinates
            if (trailLayerRef.current) {
                leafletMapRef.current.removeLayer(trailLayerRef.current);
                trailLayerRef.current = null;
            }
            return;
        }

        // Remove existing trail layer
        if (trailLayerRef.current) {
            leafletMapRef.current.removeLayer(trailLayerRef.current);
        }

        // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
        const latLngs = coordinates.map(coord => [coord[1], coord[0]]);

        // Create polyline for trail
        const trailLine = L.polyline(latLngs, {
            color: '#00FF88',
            weight: 4,
            opacity: 0.8,
            lineJoin: 'round',
            lineCap: 'round',
            dashArray: '10, 5',
            className: 'trail-line'
        });

        // Add glow effect with a wider polyline underneath
        const glowLine = L.polyline(latLngs, {
            color: '#00FF88',
            weight: 8,
            opacity: 0.3,
            lineJoin: 'round',
            lineCap: 'round',
        });

        // Create layer group
        const trailGroup = L.layerGroup([glowLine, trailLine]);
        trailGroup.addTo(leafletMapRef.current);
        trailLayerRef.current = trailGroup;

        // Add markers for start and end points
        if (latLngs.length > 0) {
            // Start marker
            const startMarker = L.marker(latLngs[0], {
                icon: L.divIcon({
                    className: 'custom-marker start-marker',
                    html: '<div class="marker-pin">🚁</div>',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                })
            }).bindPopup('<strong>Trail Start</strong>');
            startMarker.addTo(trailGroup);

            // End marker (current position)
            const endMarker = L.marker(latLngs[latLngs.length - 1], {
                icon: L.divIcon({
                    className: 'custom-marker end-marker',
                    html: '<div class="marker-pin pulse-marker">📍</div>',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                })
            }).bindPopup('<strong>Current Position</strong>');
            endMarker.addTo(trailGroup);
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
