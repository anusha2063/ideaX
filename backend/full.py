from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import time
import math
import numpy as np

app = Flask(__name__)
CORS(app)

# -------------------- GLOBAL STATE --------------------
BASE_LAT = 28.2134
BASE_LON = 85.4293

trail_points = []        # LineString
landslide_polygon = []   # Polygon (single)

frame_index = 0

# -------------------- LOAD MODEL --------------------
model = YOLO("best.pt")

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
def mask_to_polygon(mask, w, h, lat, lon):
    contours, _ = cv2.findContours(
        mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        return []

    largest = max(contours, key=cv2.contourArea)

    geo_polygon = []
    for point in largest:
        x, y = point[0]
        glat, glon = pixel_to_geo(x, y, w, h, lat, lon)
        geo_polygon.append([glon, glat])

    # Close polygon
    if geo_polygon[0] != geo_polygon[-1]:
        geo_polygon.append(geo_polygon[0])

    return geo_polygon

# -------------------- VIDEO + YOLO --------------------
def detect_and_stream():
    global frame_index, trail_points, landslide_polygon

    cap = cv2.VideoCapture("video.mp4")
    fps = cap.get(cv2.CAP_PROP_FPS)
    delay = 1 / fps if fps > 0 else 0.03

    while True:
        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        frame_index += 1
        gps_lat, gps_lon = simulate_gps(frame_index)

        results = model(frame, conf=0.6, verbose=False)
        r = results[0]

        if r.masks is not None:
            mask = r.masks.data[0].cpu().numpy()

            mask_resized = cv2.resize(
                mask.astype("uint8"),
                (frame.shape[1], frame.shape[0]),
                interpolation=cv2.INTER_NEAREST
            )

            ys, xs = np.where(mask_resized > 0.5)

            # -------- TRAIL (CENTROID) --------
            if len(xs) > 0:
                cx = int(xs.mean())
                cy = int(ys.mean())

                lat, lon = pixel_to_geo(
                    cx, cy,
                    frame.shape[1],
                    frame.shape[0],
                    gps_lat,
                    gps_lon
                )

                trail_points.append([lon, lat])
                trail_points[:] = trail_points[-1000:]

            # -------- LANDSLIDE POLYGON --------
            landslide_polygon = mask_to_polygon(
                mask_resized,
                frame.shape[1],
                frame.shape[0],
                gps_lat,
                gps_lon
            )

            # -------- VIDEO OVERLAY --------
            overlay = frame.copy()
            overlay[mask_resized > 0.5] = (0, 255, 0)
            frame = cv2.addWeighted(frame, 0.7, overlay, 0.3, 0)

        time.sleep(delay)

        # Optimize stream: Resize for faster transmission
        frame = cv2.resize(frame, (640, 360)) 

        # Encode with lower quality for speed
        ret, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" +
            buffer.tobytes() +
            b"\r\n"
        )

    cap.release()

# -------------------- ROUTES --------------------

@app.route("/")
def home():
    return jsonify({"status": "SkyWeave backend running"})

@app.route("/set_base_location", methods=["POST"])
def set_base_location():
    global BASE_LAT, BASE_LON, trail_points, landslide_polygon, frame_index

    data = request.json
    BASE_LAT = data["lat"]
    BASE_LON = data["lon"]

    trail_points = []
    landslide_polygon = []
    frame_index = 0

    return jsonify({
        "status": "Base location set",
        "lat": BASE_LAT,
        "lon": BASE_LON
    })

@app.route("/stream")
def stream():
    return Response(
        detect_and_stream(),
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
    if not landslide_polygon:
        return jsonify({"type": "FeatureCollection", "features": []})

    return jsonify({
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [landslide_polygon]
        }
    })

# -------------------- RUN --------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
