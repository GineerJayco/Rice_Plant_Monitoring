# 🔧 Environment Variables Reference

## Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Express server port | `3001` |
| `NODE_ENV` | Environment type | `development` or `production` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (admin) | `eyJhbGc...` |
| `MQTT_BROKER` | HiveMQ Cloud broker | `d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud` |
| `MQTT_PORT` | MQTT secure port | `8883` |
| `MQTT_USERNAME` | MQTT username | `thesis_pi` |
| `MQTT_PASSWORD` | MQTT password | `your-mqtt-password` |
| `MQTT_TOPICS` | Topics to subscribe (comma-separated) | `rice/sensors,rice/image,rice/detection` |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:5173` or `https://app.vercel.app` |
| `LOG_LEVEL` | Logging level | `info`, `debug`, `error` |

## Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend server URL | `http://localhost:3001` |
| `VITE_API_URL` | Original API endpoint (optional) | `http://localhost:5000` |
| `VITE_MQTT_BROKER` | MQTT broker URL | `d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud` |
| `VITE_MQTT_WEBSOCKET_PORT` | WebSocket port for browser | `8884` |
| `VITE_MQTT_USERNAME` | MQTT username | `thesis_pi` |
| `VITE_MQTT_PASSWORD` | MQTT password | `your-mqtt-password` |
| `VITE_USE_MOCK` | Use mock data | `false` or `true` |

## How to Get Supabase Keys

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the values:
   - `Project URL` → `SUPABASE_URL`
   - Under `Project API keys`:
     - `anon public` → `SUPABASE_ANON_KEY`
     - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ IMPORTANT:** Never commit `.env` files to GitHub. Use `.env.example` as template.

## Deployment

### Render (Backend)

Set these in Render Dashboard → Environment:

```env
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MQTT_BROKER=d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=thesis_pi
MQTT_PASSWORD=your-mqtt-password
CORS_ORIGIN=https://your-app.vercel.app
```

### Vercel (Frontend)

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
VITE_BACKEND_URL=https://rice-monitoring-backend.onrender.com
VITE_MQTT_BROKER=d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud
VITE_MQTT_WEBSOCKET_PORT=8884
VITE_MQTT_USERNAME=thesis_pi
VITE_MQTT_PASSWORD=your-mqtt-password
```
