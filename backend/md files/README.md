# 🚀 Rice Plant Monitoring Backend

Backend server for the Rice Plant Monitoring System. Subscribes to MQTT topics, stores sensor/image/detection data in Supabase PostgreSQL, and provides REST API for the frontend dashboard.

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials and MQTT settings

# 3. Initialize database (run once)
npm run init-db

# 4. Start server
npm run dev
```

The server will:
- ✅ Connect to Supabase
- ✅ Subscribe to MQTT topics
- ✅ Store all incoming data
- ✅ Serve REST API on `http://localhost:3001`

### Production Deployment

Deploy on **Render** or **Railway**:

```bash
# Render detects package.json automatically
# Just set environment variables and deploy
```

See [BACKEND_DEPLOYMENT_GUIDE.md](../BACKEND_DEPLOYMENT_GUIDE.md) for step-by-step instructions.

---

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Main server file
│   ├── services/
│   │   └── mqtt.js           # MQTT subscription & data handling
│   ├── routes/
│   │   ├── health.js         # Health check endpoint
│   │   └── history.js        # Historical data endpoints
│   └── db/
│       ├── supabase.js       # Database operations
│       ├── schema.js         # SQL schema (for migrations)
│       └── init.js           # Initialize database
├── package.json              # Dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

---

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server and MQTT connection status.

### Sensor Data
```
GET /api/history/sensors
  ?startDate=2024-01-01T00:00:00Z
  &endDate=2024-01-31T23:59:59Z
  &limit=100
```
Returns sensor readings (temperature, humidity, soil moisture, water levels).

### Plant Detections
```
GET /api/history/detections
  ?plant=1
  &limit=50
```
Returns disease detection results for a plant.

### Detection Summary
```
GET /api/history/detections/summary/1
  ?startDate=2024-01-01T00:00:00Z
  &endDate=2024-01-31T23:59:59Z
```
Returns detection statistics (healthy count, sheath blight count, avg inference time).

### Plant Images
```
GET /api/history/images
  ?plant=1
  &limit=50
```
Returns list of captured images for a plant.

---

## How It Works

### Data Flow

```
1. ESP32/Raspberry Pi publishes to MQTT
                 ↓
2. Backend subscribes to:
   - rice/sensors (hourly readings)
   - rice/image (plant photos)
   - rice/detection (disease detection results)
                 ↓
3. Backend stores all data in Supabase PostgreSQL
                 ↓
4. Frontend queries via REST API
                 ↓
5. Dashboard displays charts & analytics
```

### MQTT Topics

| Topic | Content | Frequency |
|-------|---------|-----------|
| `rice/sensors` | `{temp, hum, soil_1-6, water_levels, timestamp}` | Every 10s |
| `rice/image` | `{plant, image: "base64..."}` | Every cycle |
| `rice/detection` | `{plants: [{healthy, sheath_blight, inference_ms}]}` | Every cycle |

### Database Tables

**sensor_readings**
- Stores hourly environmental data
- Indexed by timestamp
- Fields: temp, humidity, soil_1-6, water levels

**plant_images**
- Stores captured plant images (base64)
- Indexed by plant_id and timestamp
- Fields: plant_id, image_data, timestamp

**plant_detections**
- Stores disease detection results
- Indexed by plant_id and timestamp
- Fields: plant_id, healthy_count, sheath_blight_count, inference_ms

---

## Environment Variables

Create `.env` from `.env.example`:

```env
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# MQTT
MQTT_BROKER=d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=thesis_pi
MQTT_PASSWORD=your-mqtt-password

# CORS
CORS_ORIGIN=http://localhost:5173,https://your-app.vercel.app
```

See [ENV_VARIABLES_GUIDE.md](../ENV_VARIABLES_GUIDE.md) for detailed explanations.

---

## Development

### NPM Scripts

```bash
npm start    # Run production server
npm run dev  # Run with auto-reload (requires --watch flag)
npm run init-db  # Initialize Supabase schema
```

### Testing Endpoints

```bash
# Check health
curl http://localhost:3001/api/health

# Fetch sensor data (last 7 days)
curl "http://localhost:3001/api/history/sensors?startDate=2024-01-01&endDate=2024-01-08"

# Fetch detections
curl "http://localhost:3001/api/history/detections?plant=1&limit=10"
```

### Troubleshooting

**Backend won't start:**
- Check `.env` file exists
- Verify Supabase credentials
- Check port 3001 is not in use

**No data appearing:**
- Check MQTT connection: `curl /api/health`
- Verify ESP32/Pi is publishing to MQTT
- Check Supabase tables for data

**MQTT disconnects:**
- Check MQTT broker credentials
- Ensure firewall allows port 8883

---

## Deployment

### Deploy on Render

1. Connect GitHub repository
2. Select `backend` directory as root
3. Set environment variables
4. Deploy

See [BACKEND_DEPLOYMENT_GUIDE.md](../BACKEND_DEPLOYMENT_GUIDE.md) for detailed steps.

---

## Cost Estimates (Annual)

| Service | Free Tier | Paid Tier | Cost |
|---------|-----------|-----------|------|
| Supabase | 500MB storage | Yes | $0 (free tier) |
| Render | Sleeps | Starter (24/7) | $7/month |
| **TOTAL** | - | - | **~$84/year** |

---

## Next Steps

- [ ] Deploy backend on Render
- [ ] Connect frontend to backend
- [ ] Verify historical data is stored
- [ ] Add data export feature
- [ ] Set up alerts for diseased plants
- [ ] Archive old data to reduce storage

---

## Support

- Check logs: `npm run dev` or Render dashboard
- Verify environment variables: `cat .env`
- Test endpoints: Use curl or Postman
- Read [BACKEND_DEPLOYMENT_GUIDE.md](../BACKEND_DEPLOYMENT_GUIDE.md)

---

**Status:** ✅ Ready for production deployment
