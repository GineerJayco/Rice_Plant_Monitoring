# Smart Irrigation Monitoring System - IoT Dashboard

A professional React-based IoT monitoring dashboard for a smart irrigation system with disease detection. Real-time monitoring of 6 plants with sensor data and camera feed integration.

## 🎯 Features

- **Real-time Monitoring** - Live sensor data with 3-second auto-refresh
- **Disease Detection** - AI-powered plant disease detection with visual indicators
- **Multi-Plant Support** - Monitor up to 6 plants (rotated via camera)
- **Live Camera Feed** - Displays real-time images from Raspberry Pi camera
- **Professional Dashboard** - Clean, modern UI with responsive design
- **Sensor Data Display** - Temperature, humidity, soil moisture, water level
- **Status Indicators** - Color-coded badges for quick status assessment
- **Mobile-Responsive** - Works on desktop, tablet, and mobile devices
- **Auto-Refresh** - Automatic data updates without manual refresh
- **Error Handling** - Graceful fallback with mock data if API unavailable

## 📦 Tech Stack

- **React 18** - UI library
- **Vite 5** - Lightning-fast bundler
- **Tailwind CSS 3** - Utility-first CSS framework
- **Axios** - HTTP client for API requests
- **ES6+** - Modern JavaScript

## 📁 Project Structure

```
smart_irrigation_dashboard/
│
├── 📁 src/
│   ├── 📁 components/           # Reusable React components
│   │   ├── Navbar.jsx           # Top navigation bar
│   │   ├── Dashboard.jsx        # Main dashboard component
│   │   ├── DataCard.jsx         # Sensor data display card
│   │   ├── StatusBadge.jsx      # Status indicator badge
│   │   └── ImageDisplay.jsx     # Camera feed display
│   │
│   ├── 📁 pages/                # Page components (for future expansion)
│   │
│   ├── 📁 services/
│   │   └── api.js               # API service layer with axios
│   │
│   ├── 📁 styles/
│   │   └── index.css            # Global styles + Tailwind
│   │
│   ├── 📁 utils/
│   │   └── mockData.js          # Mock data for testing
│   │
│   ├── 📁 assets/               # Images and static files
│   │
│   ├── App.jsx                  # Main app component
│   └── main.jsx                 # React entry point
│
├── 📁 public/                   # Static assets
│
├── 📄 Configuration Files
│   ├── package.json             # Dependencies and scripts
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS config
│   ├── postcss.config.js        # PostCSS config
│   ├── .eslintrc.cjs            # ESLint rules
│   └── index.html               # HTML entry point
│
└── 📄 Documentation
    ├── README.md                # This file
    ├── .env.example             # Environment variables template
    └── API_GUIDE.md             # API integration guide
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Raspberry Pi with Flask/FastAPI backend (or use mock data to test)

### Installation

1. **Navigate to project directory:**
   ```bash
   cd "path/to/smart_irrigation_dashboard"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file (optional):**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Raspberry Pi's IP address:
   ```
   VITE_API_URL=http://192.168.1.100:5000
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:3000`

## 📋 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🔌 API Integration

### Expected Backend API Response

The dashboard expects the Raspberry Pi backend to provide:

```
GET /api/current-data
```

Response format:
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

### Setup Steps

1. **Backend ready (Flask/FastAPI):**
   - Update `VITE_API_URL` in `.env.local`
   - Ensure `VITE_USE_MOCK=false` (default)

2. **Backend not ready:**
   - Set `VITE_USE_MOCK=true` in `.env.local`
   - Mock data auto-generates varied readings

### Mock Data Mode

Currently set to use mock data for easy testing without backend:

```javascript
// In `.env.local`
VITE_USE_MOCK=true
```

Mock data generator creates realistic variations in sensor readings.

## 🎨 UI Components

### Dashboard Component
Main monitoring interface with:
- Plant identification
- Real-time sensor display
- Disease detection status
- Camera feed integration
- Auto-refresh every 3 seconds

### DataCard Component
Reusable card for sensor values:
- Title, value, unit display
- Color-coded backgrounds
- Emoji icons
- Hover effects

### StatusBadge Component
Status indicator with types:
- `success` (Green) - Normal/No disease
- `danger` (Red) - Disease detected
- `warning` (Yellow) - Warning state
- `info` (Blue) - Information

### ImageDisplay Component
Camera feed display:
- Live badge indicator
- Timestamp display
- Placeholder on error
- Loading state

### Navbar Component
Header with:
- Project branding
- Live monitoring indicator
- Responsive layout

## 📱 Responsive Design

- **Desktop**: Full grid layout with side-by-side image and data
- **Tablet**: Stacked grid with responsive spacing
- **Mobile**: Single column layout, optimized touch targets

## 🔄 Data Refresh

- **Auto-refresh interval**: 4 seconds
- **Configurable**: Change interval in `Dashboard.jsx` useEffect hook
- **No page reload**: Smooth state updates with React

## 🎯 Customization

### Change Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: "#0f766e",    // Teal
  secondary: "#059669",  // Green
  danger: "#ef4444",     // Red
  // ... more colors
}
```

### Adjust Refresh Rate
In `Dashboard.jsx` useEffect:
```javascript
const interval = setInterval(() => {
  fetchData();
}, 4000);  // Change 4000 to desired milliseconds
```

### Add More Sensor Types
Update `DataCard` component and add new parameter in Dashboard grid.

## 🐛 Troubleshooting

### Problem: "Failed to fetch data" error
- **Solution**: Check if Raspberry Pi backend is running
- **Fallback**: App uses mock data automatically
- **Check**: Verify `VITE_API_URL` is correct

### Problem: Images not loading
- **Solution**: Verify image paths on Raspberry Pi
- **Fallback**: Placeholder images shown on error
- **Check**: Image URL format in API response

### Problem: Styling not working
```bash
# Clear cache and restart
rm -rf node_modules/.cache
npm run dev
```

### Problem: Port 3000 in use
```bash
npm run dev -- --port 3001
```

## 🚀 Deployment

### Deploy to Vercel
```bash
npm run build
vercel
```

### Deploy to Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Self-hosted
1. Run `npm run build`
2. Upload `dist` folder to your server
3. Point domain to server

## 🔐 Security Notes

- API calls use axios with timeout (10 seconds)
- Environment variables for sensitive data
- CORS considerations if on different domain
- API authentication can be added in `services/api.js`

## 📊 Performance

- Lightweight bundle (~50KB gzipped)
- Optimized re-renders with React hooks
- Smooth animations (CSS transitions)
- Responsive images with lazy loading support

## 📚 Future Enhancements

- [ ] Historical data charts (Chart.js/Recharts)
- [ ] Alert notifications for thresholds
- [ ] User authentication
- [ ] Data export (CSV/PDF)
- [ ] Multiple dashboard layouts
- [ ] Greenhouse control panel
- [ ] Plant watering history
- [ ] Humidity and temperature recommendations

## 📞 Support & Documentation

- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Axios**: https://axios-http.com

## 📄 License

Open source project for educational and thesis purposes.

---

**Built for IoT Smart Irrigation Systems with AI Disease Detection** 🌱

Dashboard Version: 1.0.0  
Last Updated: April 2026
