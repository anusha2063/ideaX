# Flask Backend Setup Guide

## Prerequisites

Make sure you have the following files in `backend/flask_api_skyweave/`:
- `best.pt` - Your trained YOLO model
- `video.webm` - Test video for trail detection

## Installation

1. **Install Python dependencies:**
   ```bash
   cd backend/flask_api_skyweave
   pip install -r requirements.txt
   ```

2. **Start the Flask server:**
   ```bash
   python full.py
   ```

   The server will start on `http://localhost:5000`

## API Endpoints

- `GET /` - Health check
- `GET /stream` - MJPEG video stream with trail detection overlay
- `GET /trail/geojson` - Get detected trail coordinates as GeoJSON
- `POST /set_base_location` - Set base GPS coordinates

## Frontend Integration

The frontend (`DroneImageryFeed` component) will:
1. Display the video stream from `/stream`
2. Poll `/trail/geojson` every second for new trail coordinates
3. Pass coordinates to the map component for real-time visualization

## Testing

1. Start Flask backend: `python full.py`
2. Start frontend: `npm run dev` (in project root)
3. Navigate to http://localhost:5175/drone
4. Click "Start Stream" to begin trail detection
5. Watch the map update in real-time with detected trails

## Troubleshooting

**Backend offline error:**
- Make sure Flask server is running on port 5000
- Check that `video.webm` and `best.pt` exist in the backend folder

**No trail coordinates:**
- Verify the YOLO model is detecting trails in the video
- Check browser console for API errors
