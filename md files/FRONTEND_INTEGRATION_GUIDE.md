# 📱 Frontend Integration Guide

How to integrate the backend's historical data API with your React dashboard.

## Quick Setup

### 1. Update Frontend Environment

Create `ui/.env.local`:

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_API_URL=http://localhost:5000
VITE_MQTT_BROKER=d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud
VITE_MQTT_WEBSOCKET_PORT=8884
VITE_MQTT_USERNAME=thesis_pi
VITE_MQTT_PASSWORD=your-mqtt-password
```

### 2. Start Backend & Frontend

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd ui
npm run dev
```

### 3. Test StoredData Component

1. Open http://localhost:5173
2. Click "Stored Data" in sidebar
3. You should see:
   - ✅ Backend connection status
   - 📊 Charts (if data exists)
   - 🎯 Disease detection summaries

---

## API Integration

The frontend uses the updated `api.js` service with new endpoints:

### Fetch Sensor History

```javascript
import { fetchSensorHistory } from '../services/api';

const data = await fetchSensorHistory(
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z',
  limit = 100
);
// Returns: { success, count, data: [...] }
```

### Fetch Detection Results

```javascript
import { fetchDetectionHistory } from '../services/api';

const data = await fetchDetectionHistory(
  plant = 1,
  limit = 50
);
// Returns: { success, count, data: [...] }
```

### Fetch Detection Summary

```javascript
import { fetchDetectionSummary } from '../services/api';

const summary = await fetchDetectionSummary(
  plant = 1,
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z'
);
// Returns: { success, summary: { total_healthy, total_sheath_blight, ... } }
```

### Check Backend Health

```javascript
import { checkBackendHealth } from '../services/api';

const health = await checkBackendHealth();
// Returns: { status, mqtt: { connected }, uptime }
```

---

## StoredData Component

The new `StoredData.jsx` component displays:

### Sensors Tab
- **Temperature & Humidity Chart** - Line chart over time
- **Soil Moisture Chart** - Average across all 6 plants
- **Water Levels Chart** - Healthy and diseased tank levels

### Detections Tab
- **Summary Cards**
  - Total healthy detections
  - Total sheath blight cases
  - Number of detection cycles
  - Average inference time
- **Recent Detections List** - Latest 50 detection results

### Controls
- **Date Range Picker** - Select custom date range
- **Tab Switcher** - Switch between Sensors/Detections
- **Plant Selector** - Choose which plant to view (for detections)
- **Auto-refresh** - Data updates when date range changes

---

## Customization

### Change Chart Colors

Edit `StoredData.jsx` chart components:

```javascript
<Line type="monotone" dataKey="temp" stroke="#ff6b6b" />
// Change #ff6b6b to any hex color
```

### Add More Charts

```javascript
<div className="bg-white/5 rounded-2xl p-6 border border-white/10">
  <h3 className="text-white font-bold mb-4">Your Chart Title</h3>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={chartData}>
      {/* Your chart here */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

### Add Export to CSV

```javascript
const exportToCSV = (data, filename) => {
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};

// Usage
exportToCSV(sensorData, 'sensor-data.csv');
```

---

## Troubleshooting

### "Backend not connected" error

**Problem:** Backend shows disconnected status

**Solution:**
1. Ensure backend is running (`npm run dev` in backend folder)
2. Check `VITE_BACKEND_URL` is correct in `.env.local`
3. Check browser console for CORS errors
4. Verify backend `.env` has correct MQTT credentials

### No charts displaying

**Problem:** Charts show but data is empty

**Solution:**
1. Check that backend is receiving MQTT messages
2. Verify Supabase database has data:
   ```bash
   # In Supabase SQL Editor
   SELECT COUNT(*) FROM sensor_readings;
   ```
3. Check date range picker - select a wider date range
4. Check backend logs for errors

### Backend takes long to respond

**Problem:** Slow chart loading

**Solution:**
1. Reduce `limit` parameter in API calls
2. Narrow date range
3. Add pagination (backend already supports limit)
4. Check Render backend logs for performance issues

### CORS errors

**Problem:** 
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
1. Update backend `.env` `CORS_ORIGIN` to match frontend URL
2. In production: Update Render environment variable
3. Redeploy backend after changing CORS_ORIGIN

---

## Deployment

### Frontend (Vercel)

```env
VITE_BACKEND_URL=https://rice-monitoring-backend.onrender.com
VITE_MQTT_BROKER=d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud
VITE_MQTT_WEBSOCKET_PORT=8884
VITE_MQTT_USERNAME=thesis_pi
VITE_MQTT_PASSWORD=your-mqtt-password
```

### Backend (Render)

Set environment variables in Render dashboard.

---

## Available Routes

| Component | Route | Function |
|-----------|-------|----------|
| Dashboard | `/` | Real-time monitoring |
| Stored Data | `/stored-data` | Historical data & charts |
| Disease Detection | `/disease-detection` | Detection details |
| Activity Log | `/activity-log` | Event history |

---

## Data Refresh Strategy

The component refetches data when:
- User changes the date range
- User switches tabs
- User changes the selected plant

To add **auto-refresh**:

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetchHistoricalData();
  }, 60000); // Refresh every 60 seconds
  
  return () => clearInterval(interval);
}, [activeTab, selectedPlant, dateRange]);
```

---

## Performance Tips

1. **Limit API requests**
   - Use date range picker to narrow data
   - Set reasonable `limit` in API calls

2. **Optimize charts**
   - Use `responive={true}` for responsive sizing
   - Avoid rendering too many data points (>1000)

3. **Cache data**
   - Store fetched data in `useMemo`
   - Avoid refetching the same data

---

## Next Steps

- ✅ Frontend integration complete
- 📋 Add data export (CSV)
- 📋 Add anomaly detection alerts
- 📋 Add predictive analytics
- 📋 Add data comparison (plant vs plant)

---

For questions, see [BACKEND_DEPLOYMENT_GUIDE.md](./BACKEND_DEPLOYMENT_GUIDE.md)
