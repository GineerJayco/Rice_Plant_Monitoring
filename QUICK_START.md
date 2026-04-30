# Quick Start Guide - Smart Irrigation Dashboard

## ⚡ 5-Minute Setup

### 1. Install Dependencies (2 min)
```bash
cd "path/to/smart_irrigation_dashboard"
npm install
```

### 2. Start Dev Server (1 min)
```bash
npm run dev
```
Browser opens to `http://localhost:3000` with live dashboard

### 3. That's It! 🎉
Dashboard is running with mock data showing realistic sensor readings.

---

## 🔧 Using Real Data (When Backend Ready)

### 1. Update Environment
Create `.env.local`:
```
VITE_API_URL=http://192.168.1.100:5000
VITE_USE_MOCK=false
```
(Replace IP with your Raspberry Pi's address)

### 2. (Optional) Force Demo Mode
If the backend is offline, you can force mock/demo mode in `.env.local`:
```
VITE_USE_MOCK=true
```

### 3. Restart Dev Server
```bash
npm run dev
```

That's it! Dashboard now uses real data from your Raspberry Pi.

---

## 📊 Dashboard Features

**Current Status:** Currently monitoring one plant at a time
- **Active Plant**: Display shows Plant 1-6 (rotated by camera)
- **Temperature**: Real-time sensor reading (°C)
- **Humidity**: Moisture in air (%)
- **Soil Moisture**: Water in soil (%)
- **Water Level**: Reservoir level (%)
- **Disease Status**: AI detection (Positive/Negative)
- **Camera Feed**: Live image from Raspberry Pi
- **Auto-Refresh**: Every 3 seconds

---

## 🎨 What's Included

✅ Professional dashboard UI  
✅ 5 Reusable React components  
✅ API service layer with Axios  
✅ Mock data for testing  
✅ Responsive mobile design  
✅ Auto-refresh every 3 seconds  
✅ Error handling & fallbacks  
✅ Clean, commented code  

---

## 📁 Key Files

- `src/components/Dashboard.jsx` - Main dashboard
- `src/components/DataCard.jsx` - Sensor data display
- `src/components/StatusBadge.jsx` - Status indicators
- `src/components/ImageDisplay.jsx` - Camera feed
- `src/services/api.js` - API calls
- `src/utils/mockData.js` - Test data

---

## 🚀 Available Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Test production build
npm run lint       # Check code quality
```

---

## 🔌 Backend Integration

See `API_GUIDE.md` for complete integration instructions with:
- Flask/FastAPI examples
- CORS setup
- Endpoint specifications
- Error handling

---

## 📱 Responsive Design

- **Desktop**: Full grid layout with side-by-side image & data
- **Tablet**: Stacked responsive layout
- **Mobile**: Single column, touch-optimized

---

## ✨ Pro Tips

1. **Mock data disabled?** Change `useMockData = true` in Dashboard.jsx
2. **API not working?** Check browser console (F12) for errors
3. **Refresh rate too fast?** Edit `setInterval(fetchData, 4000)` in Dashboard.jsx
4. **Styling not updating?** Clear browser cache (Ctrl+Shift+Delete)

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `npm run dev -- --port 3001` |
| Blank screen | Check console (F12 → Console tab) |
| API errors | Verify backend URL in `.env.local` |
| Images not showing | Check image paths on Raspberry Pi |
| Styles missing | Run `npm run dev` in clean terminal |

---

## 🎯 Next Steps

1. ✅ Test with mock data (current setup)
2. Setup Raspberry Pi backend (Python Flask/FastAPI)
3. Configure `.env.local` with backend URL
4. Set `VITE_USE_MOCK=false`
5. Deploy to production

---

**Questions?** Check `README.md` or `API_GUIDE.md`

**Ready to deploy?** Run `npm run build` and upload `dist` folder

---

Dashboard Version: 1.0.0  
Last Updated: April 2026
