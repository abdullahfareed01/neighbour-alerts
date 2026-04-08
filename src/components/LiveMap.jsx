/* eslint-disable react-hooks/immutability */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const INCIDENT_TYPES = {
  theft: { color: "#ef4444", label: "Theft", icon: "🚨" },
  robbery: { color: "#dc2626", label: "Robbery", icon: "⚠️" },
  vandalism: { color: "#f59e0b", label: "Vandalism", icon: "🔨" },
  suspicious: { color: "#eab308", label: "Suspicious", icon: "👁️" },
  traffic: { color: "#3b82f6", label: "Traffic", icon: "🚗" },
  emergency: { color: "#8b5cf6", label: "Emergency", icon: "🚑" },
};

function LiveMap({ darkMode, blur }) {
  const canvasRef = useRef(null);
  const [userLocation] = useState({ x: 0.5, y: 0.5 });
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(0);
  const [nextChangeTime, setNextChangeTime] = useState(3000);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  // Generate random incidents
  useEffect(() => {
    const generateIncidents = () => {
      const types = Object.keys(INCIDENT_TYPES);
      return Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 0.2 + Math.random() * 0.6,
        y: 0.2 + Math.random() * 0.6,
        type: types[Math.floor(Math.random() * types.length)],
        timestamp: Date.now() - Math.random() * 3600000,
        scale: 0,
      }));
    };
    setIncidents(generateIncidents());
  }, []);

  // Switch selected incident automatically
  useEffect(() => {
    if (incidents.length === 0) return;

    const switchIncident = () => {
      setSelectedIncident((prev) => (prev + 1) % incidents.length);
      // Random duration between 2-4 seconds
      setNextChangeTime(2000 + Math.random() * 2000);
    };

    const timer = setTimeout(switchIncident, nextChangeTime);
    return () => clearTimeout(timer);
  }, [incidents.length, selectedIncident, nextChangeTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Animate incident markers appearing
    incidents.forEach((incident, i) => {
      setTimeout(
        () => {
          setIncidents((prev) =>
            prev.map((inc) =>
              inc.id === incident.id ? { ...inc, scale: 1 } : inc,
            ),
          );
        },
        800 + i * 100,
      );
    });

    // Animation loop
    const animate = () => {
      timeRef.current += 0.01;
      const time = timeRef.current;

      // Clear with background
      ctx.fillStyle = darkMode
        ? "rgb(3, 7, 18)" // Very dark blue-black
        : "rgb(241, 245, 249)"; // Light slate
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid (map-like)
      drawGrid(ctx, canvas, time, darkMode);

      // Draw roads/paths
      drawRoads(ctx, canvas, darkMode);

      // Draw polyline to selected incident (animated)
      if (selectedIncident !== null) {
        drawPolyline(
          ctx,
          canvas,
          userLocation,
          incidents[selectedIncident],
          time,
          darkMode,
        );
      }

      // Draw incident markers
      incidents.forEach((incident) => {
        drawIncidentMarker(ctx, canvas, incident, time, darkMode);
      });

      // Draw user location marker (pulsing)
      // eslint-disable-next-line react-hooks/immutability
      drawUserMarker(ctx, canvas, userLocation, time, darkMode);

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [incidents, selectedIncident, darkMode, userLocation]);

  const drawGrid = (ctx, canvas, time, dark) => {
    const gridSize = 80;
    const offset = (time * 20) % gridSize;

    ctx.strokeStyle = dark
      ? "rgba(59, 130, 246, 0.05)"
      : "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = -offset; x < canvas.width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = -offset; y < canvas.height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const drawRoads = (ctx, canvas, dark) => {
    ctx.strokeStyle = dark
      ? "rgba(71, 85, 105, 0.3)"
      : "rgba(203, 213, 225, 0.6)";
    ctx.lineWidth = 3;

    // Horizontal roads
    [0.25, 0.5, 0.75].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * y);
      ctx.lineTo(canvas.width, canvas.height * y);
      ctx.stroke();
    });

    // Vertical roads
    [0.3, 0.7].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(canvas.width * x, 0);
      ctx.lineTo(canvas.width * x, canvas.height);
      ctx.stroke();
    });
  };

  const drawUserMarker = (ctx, canvas, location, time, dark) => {
    const x = canvas.width * location.x;
    const y = canvas.height * location.y;
    const pulse = Math.sin(time * 3) * 0.3 + 1;

    // Outer pulse rings
    for (let i = 3; i > 0; i--) {
      const radius = 30 * pulse * (i / 3);
      const opacity = (0.3 / i) * (1 - (i - 1) / 3);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(59, 130, 246, ${opacity})`);
      gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Main marker
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
    gradient.addColorStop(0, "#60a5fa");
    gradient.addColorStop(1, "#3b82f6");
    ctx.fillStyle = gradient;
    ctx.fill();

    // White center
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawIncidentMarker = (ctx, canvas, incident, time, dark) => {
    const x = canvas.width * incident.x;
    const y = canvas.height * incident.y;
    const config = INCIDENT_TYPES[incident.type];
    const scale = incident.scale;

    if (scale === 0) return;

    // Pulsing effect for recent incidents
    const age = Date.now() - incident.timestamp;
    const isRecent = age < 1800000; // 30 minutes
    const pulse = isRecent ? Math.sin(time * 4) * 0.2 + 1 : 1;

    // Shadow
    ctx.beginPath();
    ctx.arc(x, y + 2, 8 * scale, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fill();

    // Glow effect
    if (isRecent) {
      const glowRadius = 20 * pulse * scale;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
      gradient.addColorStop(0, `${config.color}40`);
      gradient.addColorStop(1, `${config.color}00`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main marker
    ctx.beginPath();
    ctx.arc(x, y, 10 * scale * pulse, 0, Math.PI * 2);
    ctx.fillStyle = config.color;
    ctx.fill();

    // White border
    ctx.beginPath();
    ctx.arc(x, y, 10 * scale * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(x, y, 6 * scale, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();
  };

  const drawPolyline = (ctx, canvas, from, to, time, dark) => {
    if (!to || to.scale === 0 || selectedIncident === null) return;

    const startX = canvas.width * from.x;
    const startY = canvas.height * from.y;
    const endX = canvas.width * to.x;
    const endY = canvas.height * to.y;

    // Animated progress (0 to 1) - faster cycle
    const progress = (time * 0.8) % 1;

    // Control points for curved path
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const offset = 50;
    const ctrlX = midX + offset;
    const ctrlY = midY - offset;

    // Draw full path (dashed)
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);

    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = dark
      ? "rgba(139, 92, 246, 0.3)"
      : "rgba(139, 92, 246, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Animated progress line
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Calculate point along curve
    const t = progress;
    const x =
      (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
    const y =
      (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;

    ctx.quadraticCurveTo(
      startX + (ctrlX - startX) * t,
      startY + (ctrlY - startY) * t,
      x,
      y,
    );

    const gradient = ctx.createLinearGradient(startX, startY, x, y);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.9)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Moving dot with glow
    const glowRadius = 12;
    const dotGradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    dotGradient.addColorStop(0, "rgba(236, 72, 153, 0.8)");
    dotGradient.addColorStop(1, "rgba(236, 72, 153, 0)");
    ctx.fillStyle = dotGradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Dot center
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ec4899";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 w-full h-full transition-all duration-700 ${
          blur ? "blur-sm scale-105" : "blur-0 scale-100"
        }`}
      />

      {/* Map Attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="fixed bottom-4 left-4 text-xs text-gray-500 dark:text-gray-600 z-10"
      >
        Live Safety Map © Neighbour Alerts
      </motion.div>
    </>
  );
}

export default LiveMap;
