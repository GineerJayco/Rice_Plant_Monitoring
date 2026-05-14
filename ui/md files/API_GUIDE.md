# API Integration Guide

Complete guide to integrate the Smart Irrigation Dashboard with your Raspberry Pi backend.

## 🔧 Backend Setup (Raspberry Pi)

### Python Flask Example

```python
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for React dashboard

# Simulated sensor data (replace with actual sensor readings)
class SensorData:
    def __init__(self):
        self.current_plant = 1
        self.temperature = 28.5
        self.humidity = 72
        self.soil_moisture = 55
        self.water_level = 85
        self.disease = "Negative"
    
    def get_current_data(self):
        return {
            "active_plant": self.current_plant,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "soil_moisture": self.soil_moisture,
            "water_level": self.water_level,
            "disease": self.disease,
            "image_url": f"/images/plant{self.current_plant}.jpg",
            "timestamp": datetime.now().isoformat()
        }

sensor = SensorData()

@app.route('/api/current-data', methods=['GET'])
def get_current_data():
    """Get current monitoring data for active plant"""
    return jsonify(sensor.get_current_data())

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "API is running"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### FastAPI Example

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlantData(BaseModel):
    active_plant: int
    temperature: float
    humidity: int
    soil_moisture: int
    water_level: int
    disease: str
    image_url: str
    timestamp: str

@app.get("/api/current-data")
async def get_current_data():
    """Get current monitoring data"""
    return {
        "active_plant": 1,
        "temperature": 28.5,
        "humidity": 72,
        "soil_moisture": 55,
        "water_level": 85,
        "disease": "Negative",
        "image_url": "/images/plant1.jpg",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
```

## 🔌 Frontend Integration

### Step 1: Configure API URL

Create `.env.local` file in project root:

```bash
VITE_API_URL=http://192.168.1.100:5000
```

Replace `192.168.1.100` with your Raspberry Pi's IP address.

### Step 2: Disable Mock Data

Edit `src/components/Dashboard.jsx` (line ~27):

```javascript
// Change this:
const useMockData = true;

// To this:
const useMockData = false;
```

### Step 3: Test Connection

The dashboard will now fetch from your backend:

1. Start your Raspberry Pi backend
2. Run `npm run dev`
3. Check browser console for any errors
4. Data should update every 4 seconds

## 📡 API Endpoints Required

### 1. Current Data Endpoint (Required)

```
GET /api/current-data
```

**Response:**
```json
{
  "active_plant": 1,
  "temperature": 28.5,
  "humidity": 72,
  "soil_moisture": 55,
  "water_level": 85,
  "disease": "Negative",
  "image_url": "/images/plant1.jpg",
  "timestamp": "2026-04-30T10:00:00Z"
}
```

**Parameters:**
- `active_plant` (int): Plant number 1-6
- `temperature` (float): Degrees Celsius
- `humidity` (int): Percentage 0-100
- `soil_moisture` (int): Percentage 0-100
- `water_level` (int): Percentage 0-100
- `disease` (string): "Positive" or "Negative"
- `image_url` (string): Path to latest plant image
- `timestamp` (string): ISO format datetime

### 2. Health Check Endpoint (Optional)

```
GET /api/health
```

Used to verify API is running.

### 3. All Plants Data Endpoint (Optional)

```
GET /api/plants
```

Returns data for all 6 plants.

### 4. Plant History Endpoint (Optional)

```
GET /api/plant/{plantId}/history
```

Returns historical data for a specific plant.

## 🚨 Error Handling

The dashboard includes error handling:

```javascript
try {
  const data = await fetchCurrentPlantData();
  setPlantData(data);
} catch (error) {
  console.error('Failed to fetch:', error);
  // Falls back to mock data
  setPlantData(mockDataGenerator());
}
```

## 🔑 Common Integration Issues

### Issue: CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:** Add CORS headers to backend:

```python
# Flask
from flask_cors import CORS
CORS(app)

# FastAPI (see example above)
```

### Issue: Connection Refused

**Error:** `Failed to fetch data`

**Solution:**
1. Verify Raspberry Pi backend is running
2. Check IP address in `.env.local`
3. Verify port number (default 5000)
4. Check firewall settings
5. Ping your Raspberry Pi: `ping 192.168.1.100`

### Issue: Timeout

**Error:** Request takes too long

**Solution:** Increase timeout in `src/services/api.js`:

```javascript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,  // Increase from 10000
});
```

## 🔐 Adding Authentication

If your API requires authentication, modify `src/services/api.js`:

```javascript
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 📊 Image Handling

The `image_url` in the API response should point to:

1. **Direct URL** (recommended):
   ```json
   "image_url": "http://192.168.1.100:5000/images/plant1.jpg"
   ```

2. **Relative path** (if same domain):
   ```json
   "image_url": "/images/plant1.jpg"
   ```

3. **Base64 encoded** (not recommended for performance):
   ```json
   "image_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
   ```

## 🧪 Testing with Mock Data

While developing frontend without backend:

```javascript
// Dashboard.jsx - Keep this enabled during development
const useMockData = true;

// Mock data generator creates realistic variations
const mockPlantData = mockDataGenerator();
// Returns different values on each call
```

## 📈 Performance Tips

1. **Optimize Images**
   - Compress images before sending
   - Use appropriate image formats (JPEG, WebP)
   - Resize images to dashboard dimensions

2. **Efficient API Calls**
   - Adjust refresh interval based on needs
   - Implement request debouncing for rapid changes
   - Cache stable data where appropriate

3. **Backend Optimization**
   - Use efficient sensor reading intervals
   - Minimize database queries
   - Implement data compression

## 🎯 Next Steps

1. Set up your Raspberry Pi backend
2. Configure API endpoint
3. Update `.env.local` with correct URL
4. Disable mock data in Dashboard.jsx
5. Test data flow
6. Monitor browser console for errors
7. Deploy to production

## 📚 Reference

- [Flask CORS Documentation](https://flask-cors.readthedocs.io/)
- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
- [Axios Documentation](https://axios-http.com/)
- [React Hooks Documentation](https://react.dev/reference/react)

---

**For questions or issues, check the main README.md or contact your development team.**
