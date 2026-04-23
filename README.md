# 🛡️ Neighbour Alert

A community safety web application that visualizes crime incidents on an interactive map — helping residents stay informed about activity in their neighbourhood in real time.




![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)
![Leaflet](https://img.shields.io/badge/Leaflet-Map-199900?style=flat&logo=leaflet)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=flat&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## ✨ Features

- 🗺️ **Interactive Crime Map** — Leaflet-powered map with incident markers, clustering, and popups
- 📍 **GPS Location Detection** — Auto-centers the map to the user's current location via `LocationContext`
- 🌙 **Dark / Light Mode** — Full theme support via custom `ThemeContext`
- 🔀 **Animated Route Lines** — Three-layer polyline system with directional flow animation (`AnimatedRouteLine.jsx`)
- 🧭 **Turn-by-Turn Directions** — Routing powered by OSRM API
- 📊 **Analytics Panel** — Animated counters, incident categorization, and time-of-day distribution charts (`AnalyticsPanel.jsx`)
- 🎛️ **Map Command Controller** — Robust map interaction system using a stable `mapInstanceRef` for reliable Leaflet access
- 📱 **Responsive Design** — Works on desktop and mobile browsers

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Map | React-Leaflet / Leaflet.js |
| Styling | Tailwind CSS |
| Routing API | OSRM (Open Source Routing Machine) |
| State | React Context API (`ThemeContext`, `LocationContext`) |
| Build Tool | Vite |

---

## 📁 Project Structure

```
neighbour-alert/
├── public/
├── src/
│   ├── components/
│   │   ├── CrimeMap.jsx          # Main map component
│   │   ├── Dashboard.jsx         # App dashboard shell
│   │   ├── Sidebar.jsx           # Navigation & filter sidebar
│   │   ├── AnalyticsPanel.jsx    # Incident stats & charts
│   │   ├── AnimatedRouteLine.jsx # Animated polyline route display
│   │   └── MapCommandController.jsx # Leaflet instance controller
│   ├── context/
│   │   ├── ThemeContext.jsx      # Dark/light mode state
│   │   └── LocationContext.jsx  # GPS location state
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/neighbour-alert.git
cd neighbour-alert

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

Copy `.env.example` to `.env` and fill in any required values:

```bash
cp .env.example .env
```

```env
# Add any API keys or config here
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📸 Screenshots

> *(Add screenshots of your map, analytics panel, and dark mode here)*

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Leaflet.js](https://leafletjs.com/) for the mapping engine
- [OpenStreetMap](https://www.openstreetmap.org/) for map tiles
- [OSRM](http://project-osrm.org/) for routing
- [Tailwind CSS](https://tailwindcss.com/) for styling
