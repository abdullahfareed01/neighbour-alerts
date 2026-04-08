import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "./index.css"
import "leaflet/dist/leaflet.css";
import "./style/animations.css";
// import "./style/mapAnimation.css";

import { ThemeProvider } from "./context/ThemeContext";
import { LocationProvider } from "./context/LocationContext";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ThemeProvider>
      <LocationProvider>
        <App />
      </LocationProvider>
    </ThemeProvider>
  </AuthProvider>
);