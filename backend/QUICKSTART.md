# Quick Start Guide - Dual Model Backend

## What Changed?

Your backend now supports **BOTH** models:
- ✅ `best.pt` - Trail detection (green overlay)
- ✅ `landslide.pt` - Landslide detection (red overlay)

## How to Use

### 1. Start the Backend Server

```bash
cd d:\ideaX\backend
python full.py
```

You should see:
```
[TRAIL] Model loaded: best.pt
[LANDSLIDE] Model loaded: landslide.pt
Flask server running on http://localhost:5000
```

---

### 2. Test the Endpoints

#### Option A: View in Browser
- Trail Stream: `http://localhost:5000/stream/trail`
- Landslide Stream: `http://localhost:5000/stream/landslide`

#### Option B: Use API Testing Tool (Postman/Thunder Client)
```bash
# Get trail GeoJSON data
GET http://localhost:5000/trail/geojson

# Get landslide GeoJSON data
GET http://localhost:5000/landslide/geojson

# Get both combined
GET http://localhost:5000/combined/geojson
```

---

### 3. Update Your Frontend

You need to update your frontend to choose which model to use. Here are examples:

#### Option 1: Toggle Between Models
```javascript
// MapView.js
const [activeModel, setActiveModel] = useState('trail');

return (
  <div>
    {/* Model Selector */}
    <select onChange={(e) => setActiveModel(e.target.value)}>
      <option value="trail">Trail Detection</option>
      <option value="landslide">Landslide Detection</option>
    </select>
    
    {/* Video Stream */}
    <img 
      src={`http://localhost:5000/stream/${activeModel}`}
      alt="Detection Stream"
    />
  </div>
);
```

#### Option 2: Show Both Side-by-Side
```javascript
// MapView.js
return (
  <div className="dual-view">
    <div className="trail-view">
      <h3>Trail Detection</h3>
      <img src="http://localhost:5000/stream/trail" />
    </div>
    
    <div className="landslide-view">
      <h3>Landslide Detection</h3>
      <img src="http://localhost:5000/stream/landslide" />
    </div>
  </div>
);
```

#### Option 3: Fetch Combined GeoJSON for Map
```javascript
// MapView.js
useEffect(() => {
  const interval = setInterval(() => {
    fetch('http://localhost:5000/combined/geojson')
      .then(res => res.json())
      .then(data => {
        // data.features[0] = trail data (green)
        // data.features[1] = landslide data (red)
        
        data.features.forEach(feature => {
          const color = feature.properties.color;
          const type = feature.properties.detection_type;
          
          // Add to map with appropriate styling
          if (type === 'trail') {
            // Add green layer
          } else if (type === 'landslide') {
            // Add red layer
          }
        });
      });
  }, 2000);
  
  return () => clearInterval(interval);
}, []);
```

---

## Available Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/stream` | GET | Default stream (trail) |
| `/stream/trail` | GET | Trail detection stream |
| `/stream/landslide` | GET | Landslide detection stream |
| `/trail/geojson` | GET | Trail GeoJSON data |
| `/landslide/geojson` | GET | Landslide GeoJSON data |
| `/combined/geojson` | GET | Both datasets |
| `/set_base_location` | POST | Reset & set GPS base |

---

## Color Coding

- 🟢 **Trail** = Green (`#00ff00`)
- 🔴 **Landslide** = Red (`#ff0000`)

---

## Next Steps

1. **Start the backend** with the command above
2. **Test the endpoints** in your browser
3. **Update your frontend** to use the new endpoints
4. **Check the map** to see both detections overlaid

---

## Troubleshooting

### Models not loading?
- Check that `best.pt` and `landslide.pt` are in `d:\ideaX\backend\`
- File sizes should be ~52 MB each

### CORS errors?
- CORS is enabled, but make sure frontend is running on a different port
- Default: Backend = 5000, Frontend = 3000

### No detections showing?
- Check video file exists: `d:\ideaX\backend\video.mp4`
- Check model confidence threshold (default: 0.6)

---

## Need Help?
See `API_DOCUMENTATION.md` for detailed endpoint documentation.
