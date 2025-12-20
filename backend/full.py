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
# Load both models at startup
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
def generate_stream(mode="trail"):
    global frame_index, trail_points, landslide_polygons

    # Select Video Source and Model based on Mode
    if mode == "landslide":
        video_path = "landslide.mp4"
        model = landslide_model
    else:
        video_path = "video.mp4"
        model = trail_model
    
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    delay = 1 / fps if fps > 0 else 0.03

    while True:
        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0) # Loop video
            continue

        frame_index += 1
        gps_lat, gps_lon = simulate_gps(frame_index)

        # Run Inference
        results = model(frame, conf=0.5, verbose=False)
        r = results[0]

        if r.masks is not None:
            # Combine all masks for display
            combined_mask = np.zeros((frame.shape[0], frame.shape[1]), dtype="uint8")
            
            # Process masks
            if mode == "trail":
                # Trail Logic: Centroid of the first/largest mask
                if len(r.masks.data) > 0:
                    mask = r.masks.data[0].cpu().numpy()
                    mask_resized = cv2.resize(mask.astype("uint8"), (frame.shape[1], frame.shape[0]), interpolation=cv2.INTER_NEAREST)
                    combined_mask = mask_resized

                    ys, xs = np.where(mask_resized > 0.5)
                    if len(xs) > 0:
                        cx = int(xs.mean())
                        cy = int(ys.mean())
                        lat, lon = pixel_to_geo(cx, cy, frame.shape[1], frame.shape[0], gps_lat, gps_lon)
                        
                        trail_points.append([lon, lat])
                        trail_points[:] = trail_points[-1000:] # Keep last 1000

            elif mode == "landslide":
                # Landslide Logic: Polygons of all masks
                for mask_data in r.masks.data:
                    m = mask_data.cpu().numpy()
                    m_resized = cv2.resize(m.astype("uint8"), (frame.shape[1], frame.shape[0]), interpolation=cv2.INTER_NEAREST)
                    combined_mask = cv2.bitwise_or(combined_mask, m_resized)
                
                # Update Landslide Polygons
                current_polygons = mask_to_polygons(combined_mask, frame.shape[1], frame.shape[0], gps_lat, gps_lon)
                if current_polygons:
                     # Keep recent polygons logic (e.g. max 50)
                     landslide_polygons.extend(current_polygons)
                     landslide_polygons[:] = landslide_polygons[-50:]

            # Visual Overlay
            overlay = frame.copy()
            color = (0, 255, 255) if mode == "trail" else (0, 0, 255) # Yellow vs Red
            overlay[combined_mask > 0.5] = color
            frame = cv2.addWeighted(frame, 0.7, overlay, 0.3, 0)

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
    mode = request.args.get('mode', 'trail')
    return Response(
        generate_stream(mode),
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
         # Empty feature collection
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
