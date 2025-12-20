from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import time
import math
import numpy as np

app = Flask(__name__)
CORS(app)

# -------------------- LOAD MODELS --------------------
print("Loading Trail Model...")
trail_model = YOLO("best.pt")
print("Loading Landslide Model...")
landslide_model = YOLO("landslide.pt")
print("Models Loaded.")

# -------------------- GLOBAL STATE --------------------
BASE_LAT = 28.2134
BASE_LON = 85.4293

trail_points = []          # LineString for Trail
landslide_polygons = []    # List of Polygons for Landslide
frame_index = 0

# -------------------- GPS SIMULATION --------------------
def simulate_gps(frame_idx):
    lat = BASE_LAT + frame_idx * 0.0000002
    lon = BASE_LON + frame_idx * 0.0000002
    return lat, lon

# -------------------- PIXEL → GEO --------------------
def pixel_to_geo(px, py, w, h, lat, lon, meters_per_pixel=0.2):
    dx = (px - w / 2) * meters_per_pixel
    dy = (py - h / 2) * meters_per_pixel

    new_lat = lat + (dy / 111320)
    new_lon = lon + (dx / (111320 * math.cos(math.radians(lat))))

    return new_lat, new_lon

# -------------------- MASK → POLYGON --------------------
def mask_to_polygons(mask, w, h, lat, lon):
    contours, _ = cv2.findContours(
        mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        return []

    polygons = []
    for contour in contours:
        if cv2.contourArea(contour) < 500: # Filter small noise
            continue
            
        geo_polygon = []
        for point in contour:
            x, y = point[0]
            glat, glon = pixel_to_geo(x, y, w, h, lat, lon)
            geo_polygon.append([glon, glat])

        # Close polygon
        if geo_polygon and geo_polygon[0] != geo_polygon[-1]:
            geo_polygon.append(geo_polygon[0])
        
        if len(geo_polygon) > 3:
            polygons.append(geo_polygon)

    return polygons

# -------------------- VIDEO HELPER --------------------
def buffer_frame(frame):
    # Encode with lower quality for speed
    frame_resized = cv2.resize(frame, (640, 360))
    ret, buffer = cv2.imencode(".jpg", frame_resized, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
    return (
        b"--frame\r\n"
        b"Content-Type: image/jpeg\r\n\r\n" +
        buffer.tobytes() +
        b"\r\n"
    )

# -------------------- STREAM GENERATOR --------------------
def generate_stream():
    global frame_index, trail_points, landslide_polygons

    # Always use landslide.mp4 for combined detection
    video_path = "video.mp4"
    cap = cv2.VideoCapture(video_path)
    
    # Check if video opened successfully
    if not cap.isOpened():
        print(f"Error: Could not open {video_path}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    delay = 1 / fps if fps > 0 else 0.03
    
    local_frame_count = 0

    while True:
        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0) # Loop video
            continue
        
        local_frame_count += 1
        frame_index += 1
        gps_lat, gps_lon = simulate_gps(frame_index)

        # ----------------- TRAIL DETECTION -----------------
        # Lower confidence to catch more of the road
        trail_results = trail_model(frame, conf=0.25, verbose=False)
        trail_r = trail_results[0]
        
        trail_mask_img = np.zeros(frame.shape[:2], dtype="uint8")
        has_trail = False

        if trail_r.masks is not None:
            # Combine all trail masks (in case road is segmented)
            for mask_data in trail_r.masks.data:
                t_mask = mask_data.cpu().numpy()
                t_mask_resized = cv2.resize(t_mask.astype("uint8"), (frame.shape[1], frame.shape[0]), interpolation=cv2.INTER_NEAREST)
                trail_mask_img = cv2.bitwise_or(trail_mask_img, t_mask_resized)
            
            # Check if we have any detection after combination
            if np.any(trail_mask_img):
                has_trail = True
                
                # Update Trail State (Centroid of combined mask)
                ys, xs = np.where(trail_mask_img > 0.5)
                if len(xs) > 0:
                    cx = int(xs.mean())
                    cy = int(ys.mean())
                    lat, lon = pixel_to_geo(cx, cy, frame.shape[1], frame.shape[0], gps_lat, gps_lon)
                    trail_points.append([lon, lat])
                    trail_points[:] = trail_points[-1500:] # Keep last 1500 history

        # ----------------- LANDSLIDE DETECTION -----------------
        landslide_results = landslide_model(frame, conf=0.5, verbose=False)
        landslide_r = landslide_results[0]

        landslide_mask_img = np.zeros(frame.shape[:2], dtype="uint8")
        has_landslide = False

        if landslide_r.masks is not None:
            # Combine all landslide masks
            for mask_data in landslide_r.masks.data:
                lm = mask_data.cpu().numpy()
                lm_resized = cv2.resize(lm.astype("uint8"), (frame.shape[1], frame.shape[0]), interpolation=cv2.INTER_NEAREST)
                landslide_mask_img = cv2.bitwise_or(landslide_mask_img, lm_resized)
            
            if np.any(landslide_mask_img):
                has_landslide = True

                # Update Landslide State
                current_polygons = mask_to_polygons(landslide_mask_img, frame.shape[1], frame.shape[0], gps_lat, gps_lon)
                landslide_polygons = current_polygons # Update to current frame's detections

        # Debug Print
        if local_frame_count % 30 == 0:
            print(f"Frame {local_frame_count}: Trail={has_trail}, Landslide={has_landslide}")

        # ----------------- VISUALIZATION -----------------
        overlay = frame.copy()
        
        # Draw Landslide (Red)
        if has_landslide:
            overlay[landslide_mask_img > 0.5] = (0, 0, 255)

        # Draw Trail (Yellow)
        if has_trail:
            overlay[trail_mask_img > 0.5] = (0, 255, 255)

        # Blend
        if has_trail or has_landslide:
            mask_combined = cv2.bitwise_or(trail_mask_img, landslide_mask_img)
            alpha = 0.6
            try:
                # Ensure mask is boolean or uint8 for indexing
                mask_bool = mask_combined > 0.5
                if np.any(mask_bool):
                    frame[mask_bool] = cv2.addWeighted(frame, 1-alpha, overlay, alpha, 0)[mask_bool]
            except Exception as e:
                print(f"Error blending: {e}")

        time.sleep(delay)
        yield buffer_frame(frame)

    cap.release()

# -------------------- ROUTES --------------------

@app.route("/")
def home():
    return jsonify({"status": "SkyWeave backend running"})

@app.route("/set_base_location", methods=["POST"])
def set_base_location():
    global BASE_LAT, BASE_LON, trail_points, landslide_polygons, frame_index

    data = request.json
    BASE_LAT = data["lat"]
    BASE_LON = data["lon"]

    trail_points = []
    landslide_polygons = []
    frame_index = 0

    return jsonify({
        "status": "Base location set",
        "lat": BASE_LAT,
        "lon": BASE_LON
    })

@app.route("/stream")
def stream():
    # Helper to check query param, defaulting to trail
    # mode = request.args.get('mode', 'trail') 
    # Ignore mode, we do BOTH now
    return Response(
        generate_stream(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

@app.route("/trail/geojson")
def trail_geojson():
    return jsonify({
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": trail_points
        }
    })

@app.route("/landslide/geojson")
def landslide_geojson():
    if not landslide_polygons:
        return jsonify({"type": "FeatureCollection", "features": []})

    features = []
    for poly in landslide_polygons:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [poly]
            },
            "properties": {"type": "landslide"}
        })

    return jsonify({
        "type": "FeatureCollection",
        "features": features
    })

# -------------------- RUN --------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
