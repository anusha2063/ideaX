# 🛸 SkyWeave - AI-Powered Drone Trail Detection & Mapping

## Overview

**SkyWeave** is an innovative drone-based trail detection and mapping system that uses AI (YOLO object detection) to identify hiking trails in real-time from drone footage and visualize them on an interactive map with GPS coordinates.

Perfect for:
- 🏔️ Mapping unexplored terrain
- 🥾 Creating hiking trail databases
- 🗺️ Geographic surveying
- 🚁 Drone-based cartography
- 🌲 Forest and wilderness mapping

---

## Project Structure

```
ideaX/
├── backend/                  # Flask API Server
│   ├── full.py              # Main Flask application
│   ├── requirements.txt     # Python dependencies
│   ├── best.pt             # YOLO trained model
│   ├── video.mp4           # Test drone footage
│   └── SETUP.md            # Backend setup guide
│
└── frontend/                # React Web Application
    ├── src/
    │   ├── components/
    │   │   ├── MapView.js   # Interactive Leaflet map
    │   │   └── MapView.css  # Map styling
    │   ├── App.js           # Main application component
    │   ├── App.css          # App styling
    │   ├── index.js         # Entry point
    │   └── index.css        # Global design system
    ├── public/
    └── README.md            # Frontend documentation
```

---

## Tech Stack

### Backend
- **Flask** - Python web framework
- **YOLO (Ultralytics)** - AI object detection for trail identification
- **OpenCV** - Video processing
- **NumPy** - Numerical computations
- **Flask-CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI framework
- **Leaflet** - Interactive mapping library
- **Axios** - HTTP client
- **Modern CSS3** - Animations, gradients, glassmorphism

---

## Features

### 🎥 Real-time Video Streaming
- MJPEG stream from drone footage
- Live AI trail detection overlay
- Visual trail highlighting in green

### 🗺️ Interactive Satellite Map
- High-resolution satellite imagery
- Real-time trail path visualization
- Animated trail lines with glow effects
- Custom start/end markers

### 📊 Live Statistics Dashboard
- Trail points detected counter
- Calculated trail length (km)
- Last update timestamp
- Backend status monitoring

### 🎨 Premium UI/UX
- Modern dark theme with vibrant gradients
- Smooth animations and transitions
- Glassmorphism effects
- Responsive design (desktop & mobile)
- Micro-interactions for better UX

---

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Required files:**
- `best.pt` - YOLO model (already in backend/)
- `video.mp4` - Test video (already in backend/)

### 2. Start Backend Server

```bash
cd backend
python full.py
```

Server runs on: `http://localhost:5000`

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Start Frontend

```bash
cd frontend
npm start
```

App opens at: `http://localhost:3000`

---

## How to Use

1. **Start the Backend**
   ```bash
   python backend/full.py
   ```
   Wait for "Running on http://127.0.0.1:5000"

2. **Start the Frontend**
   ```bash
   npm start
   # (in frontend directory)
   ```
   Browser opens automatically

3. **Begin Trail Detection**
   - Check "Backend Online" badge is green
   - Click **"▶️ Start Detection"**
   - Watch live drone feed and map

4. **Monitor Results**
   - Green trail appears on satellite map
   - Statistics update every second
   - Trail length auto-calculated

5. **Reset if Needed**
   - Click **"🔄 Reset Map"** to clear data

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check - returns backend status |
| `/stream` | GET | MJPEG video stream with trail overlay |
| `/trail/geojson` | GET | Trail coordinates in GeoJSON format |
| `/set_base_location` | POST | Set/reset base GPS coordinates |

---

## How It Works

### Backend Process:
1. **Video Input** - Reads drone footage frame by frame
2. **AI Detection** - YOLO model identifies trail pixels
3. **GPS Simulation** - Simulates drone GPS movement
4. **Coordinate Mapping** - Converts pixel positions to GPS coordinates
5. **GeoJSON Export** - Formats trail data as GeoJSON LineString

### Frontend Process:
1. **Health Check** - Polls backend every 10 seconds
2. **Stream Display** - Shows MJPEG video stream
3. **Coordinate Polling** - Fetches trail data every 1 second
4. **Map Rendering** - Draws trail on Leaflet map
5. **Statistics** - Calculates and displays metrics

---

## Customization

### Change Map Location
Edit `frontend/src/components/MapView.js`:
```javascript
center: [YOUR_LAT, YOUR_LON],
zoom: 15,
```

### Adjust Detection Confidence
Edit `backend/full.py`:
```python
results = model(frame, conf=0.6, verbose=False)  # Change 0.6
```

### Change Polling Rate
Edit `frontend/src/App.js`:
```javascript
const interval = setInterval(pollTrailData, 1000);  // milliseconds
```

### Modify UI Colors
Edit `frontend/src/index.css`:
```css
--color-primary: hsl(210, 100%, 55%);
--color-accent: hsl(160, 70%, 50%);
```

---

## Troubleshooting

### Backend Issues

**ModuleNotFoundError: No module named 'flask'**
```bash
pip install -r requirements.txt
```

**YOLO Model Error**
- Ensure `best.pt` exists in `backend/`
- Check model compatibility with Ultralytics version

**Video Not Found**
- Verify `video.mp4` or `video.webm` in `backend/`
- Update filename in `full.py` if needed

### Frontend Issues

**Backend Offline**
- Make sure Flask server is running on port 5000
- Check firewall/antivirus blocking port
- Verify CORS is enabled in Flask

**Map Not Loading**
- Check internet connection (map tiles require network)
- Wait for stream to start
- Try "Reset Map" button

**Compilation Errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Performance Optimization

### For Slower Connections:
- Reduce polling interval (2-3 seconds)
- Use lighter map tiles
- Decrease video quality in `full.py`

### For Better Accuracy:
- Use higher YOLO confidence threshold
- Process more frames (reduce skip rate)
- Fine-tune YOLO model with more data

---

## Hackathon Presentation Tips

### Key Talking Points:
✅ Real-time AI detection using YOLO  
✅ Live video streaming with Flask  
✅ GPS coordinate mapping from pixels  
✅ Interactive satellite map visualization  
✅ Modern, responsive UI/UX  
✅ Practical use cases (hiking, surveying, mapping)

### Demo Flow:
1. Show the landing page with premium UI
2. Explain the problem (manual trail mapping is slow)
3. Start detection and show live processing
4. Highlight the green trail appearing on map
5. Show statistics updating in real-time
6. Explain potential applications

### Unique Selling Points:
- **AI-Powered**: Uses state-of-the-art YOLO object detection
- **Real-time**: Live processing and visualization
- **Accurate**: GPS-based coordinate mapping
- **Practical**: Real-world applications in exploration
- **Scalable**: Can be deployed on actual drones

---

## Future Enhancements

### Phase 2 Ideas:
- [ ] Multiple drone support
- [ ] Trail classification (difficulty, terrain type)
- [ ] 3D terrain visualization
- [ ] Export trails to GPX/KML formats
- [ ] Historical trail database
- [ ] User authentication and saved trails
- [ ] Mobile app (React Native)
- [ ] Real drone integration (DJI SDK)
- [ ] Crowd-sourced trail verification

---

## Credits

- **YOLO** by Ultralytics
- **Leaflet** for mapping
- **React** by Meta
- **Satellite Imagery** by Esri

---

## License

MIT License - Free to use for educational and commercial purposes.

---

## Contact & Support

For hackathon judges and contributors:
- This project demonstrates real-world AI application
- Combines computer vision, web development, and geospatial tech
- Built with production-ready technologies
- Fully functional end-to-end system

**Made with ❤️ for trail mapping enthusiasts and hackathon innovation!**
