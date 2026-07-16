import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const { dark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let W, H;

    // ── Config ────────────────────────────────────────────────────────────
    const GRID      = 60;
    const DOT_COUNT = 18;
    const LINE_COUNT = 6;

    // ── State ─────────────────────────────────────────────────────────────
    const dots = [];
    const lines = [];
    let t = 0;

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };

    const initDots = () => {
      dots.length = 0;
      for (let i = 0; i < DOT_COUNT; i++) {
        dots.push({
          x:     Math.random() * W,
          y:     Math.random() * H,
          r:     2 + Math.random() * 3,
          speed: 0.15 + Math.random() * 0.25,
          angle: Math.random() * Math.PI * 2,
          phase: Math.random() * Math.PI * 2,
          pulse: 0,
          pulsing: Math.random() > 0.6,
        });
      }
    };

    const initLines = () => {
      lines.length = 0;
      for (let i = 0; i < LINE_COUNT; i++) {
        const fromDot = Math.floor(Math.random() * DOT_COUNT);
        const toDot   = Math.floor(Math.random() * DOT_COUNT);
        lines.push({
          from:     fromDot,
          to:       toDot,
          progress: Math.random(),
          speed:    0.001 + Math.random() * 0.002,
        });
      }
    };

    resize();
    initDots();
    initLines();

    const ro = new ResizeObserver(() => {
      resize();
      initDots();
      initLines();
    });
    ro.observe(canvas);

    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, W, H);

      const isDark = document.documentElement.classList.contains("dark");

      // ── Grid lines ────────────────────────────────────────────────────
      ctx.strokeStyle = isDark ? "rgba(59,130,246,0.06)" : "rgba(79,70,229,0.05)";
      ctx.lineWidth = 0.8;
      for (let x = 0; x < W; x += GRID) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += GRID) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // ── Grid intersection dots ────────────────────────────────────────
      ctx.fillStyle = isDark ? "rgba(59,130,246,0.12)" : "rgba(99,102,241,0.1)";
      for (let x = 0; x < W; x += GRID) {
        for (let y = 0; y < H; y += GRID) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Route polylines between moving dots ───────────────────────────
      for (const ln of lines) {
        ln.progress += ln.speed;
        if (ln.progress > 1) ln.progress = 0;

        const a = dots[ln.from];
        const b = dots[ln.to];
        const px = a.x + (b.x - a.x) * ln.progress;
        const py = a.y + (b.y - a.y) * ln.progress;

        // Full route line (faint)
        ctx.strokeStyle = isDark
          ? "rgba(99,102,241,0.10)"
          : "rgba(79,70,229,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Moving head dot on route
        ctx.fillStyle = isDark
          ? `rgba(139,92,246,${0.5 + 0.3 * Math.sin(t + ln.progress * 10)})`
          : `rgba(99,102,241,${0.4 + 0.3 * Math.sin(t + ln.progress * 10)})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Incident marker dots ──────────────────────────────────────────
      for (const d of dots) {
        // Slow drift
        d.x += Math.cos(d.angle + t * d.speed) * 0.3;
        d.y += Math.sin(d.angle + t * d.speed) * 0.3;
        // Bounce off edges
        if (d.x < 0) d.x = W;
        if (d.x > W) d.x = 0;
        if (d.y < 0) d.y = H;
        if (d.y > H) d.y = 0;

        const alpha = isDark
          ? 0.5 + 0.3 * Math.sin(t * 1.2 + d.phase)
          : 0.35 + 0.2 * Math.sin(t * 1.2 + d.phase);

        if (d.pulsing) {
          d.pulse += 0.04;
          const pulseR = d.r + Math.sin(d.pulse) * 6;
          const pulseA = isDark
            ? 0.12 + 0.08 * Math.sin(d.pulse)
            : 0.08 + 0.05 * Math.sin(d.pulse);

          const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, pulseR + 8);
          grad.addColorStop(0, isDark
            ? `rgba(59,130,246,${pulseA * 2})`
            : `rgba(79,70,229,${pulseA * 2})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(d.x, d.y, pulseR + 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pin dot
        ctx.fillStyle = isDark
          ? `rgba(96,165,250,${alpha})`
          : `rgba(79,70,229,${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Floating gradient mesh orbs ───────────────────────────────────
      const orbs = [
        { cx: 0.2, cy: 0.3, r: 0.28, color1: isDark ? "rgba(59,130,246,0.07)" : "rgba(99,102,241,0.06)", color2: "rgba(0,0,0,0)" },
        { cx: 0.8, cy: 0.7, r: 0.32, color1: isDark ? "rgba(139,92,246,0.07)" : "rgba(139,92,246,0.05)", color2: "rgba(0,0,0,0)" },
        { cx: 0.5, cy: 0.1, r: 0.22, color1: isDark ? "rgba(59,130,246,0.05)" : "rgba(79,70,229,0.04)", color2: "rgba(0,0,0,0)" },
      ];
      for (const orb of orbs) {
        const ox = orb.cx * W + Math.sin(t * 0.4 + orb.cx * 10) * 40;
        const oy = orb.cy * H + Math.cos(t * 0.3 + orb.cy * 10) * 30;
        const r  = orb.r * Math.max(W, H);
        const g  = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
        g.addColorStop(0, orb.color1);
        g.addColorStop(1, orb.color2);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []); // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}