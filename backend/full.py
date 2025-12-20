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
# Langtang Valley, Nepal
BASE_LAT = 28.2134
BASE_LON = 85.4293

trail_geo_points = []   # [lon, lat]
frame_index = 0

# -------------------- LOAD MODEL --------------------
model = YOLO("best.pt")

# -------------------- GPS SIMULATION --------------------
def simulate_gps(frame_idx):
    # VERY slow movement (realistic)
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

# -------------------- VIDEO + YOLO PIPELINE --------------------
def detect_and_stream():
    global frame_index, trail_geo_points

    cap = cv2.VideoCapture("video.mp4")

    if not cap.isOpened():
        print("ERROR: Could not open video.mp4")
        return

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

            # ---- USE CENTROID ONLY (KEY FIX) ----
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

                trail_geo_points.append([lon, lat])

                # limit trail size (performance)
                if len(trail_geo_points) > 1000:
                    trail_geo_points = trail_geo_points[-1000:]

            # ---- GREEN OVERLAY ----
            overlay = frame.copy()
            overlay[mask_resized > 0.5] = (0, 255, 0)
            frame = cv2.addWeighted(frame, 0.7, overlay, 0.3, 0)

        time.sleep(delay)

        ret, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" +
            frame_bytes +
            b"\r\n"
        )

    cap.release()

# -------------------- ROUTES --------------------

@app.route("/")
def home():
    return jsonify({"status": "SkyWeave backend running"})

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
        "properties": {},
        "geometry": {
            "type": "LineString",
            "coordinates": trail_geo_points
        }
    })

@app.route("/set_base_location", methods=["POST"])
def set_base_location():
    global BASE_LAT, BASE_LON, trail_geo_points, frame_index

    data = request.json
    BASE_LAT = data["lat"]
    BASE_LON = data["lon"]

    trail_geo_points = []
    frame_index = 0

    return jsonify({
        "status": "Base location set",
        "lat": BASE_LAT,
        "lon": BASE_LON
    })

# -------------------- RUN --------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
