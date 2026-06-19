"use client";

import { memo, useEffect, useRef } from "react";

const PARTICLE_COUNT = 55;
const GOLD_PALETTE = [
  [234, 179, 8],   // gold-500
  [250, 204, 21],  // gold-400
  [202, 138, 4],   // gold-600
  [161, 98, 7],    // gold-700
  [26, 26, 26],    // charcoal accent
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/** @param {[number,number,number]} rgb @param {number} alpha */
function rgba(rgb, alpha) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function createParticle(w, h, i) {
  const color = GOLD_PALETTE[i % GOLD_PALETTE.length];
  return {
    x: randomBetween(0, w),
    y: randomBetween(0, h),
    vx: randomBetween(-0.18, 0.18),
    vy: randomBetween(-0.28, -0.06),
    radius: randomBetween(1.2, 3.2),
    alpha: randomBetween(0.1, 0.55),
    alphaDir: Math.random() > 0.5 ? 1 : -1,
    alphaDelta: randomBetween(0.003, 0.009),
    color,
    pulsePhase: randomBetween(0, Math.PI * 2),
    pulseSpeed: randomBetween(0.008, 0.022),
  };
}

/**
 * Premium ambient particle canvas — dark-and-gold micro-particles.
 * Runs at 60fps via rAF; uses a single canvas element.
 *
 * @param {{ active: boolean }} props
 */
function FlowParticleCanvasInner({ active }) {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const stateRef = useRef({
    rafId: 0,
    particles: /** @type {ReturnType<typeof createParticle>[]} */ ([]),
    w: 0,
    h: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = stateRef.current;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      state.w = w;
      state.h = h;

      if (state.particles.length === 0) {
        state.particles = Array.from({ length: PARTICLE_COUNT }, (_, i) =>
          createParticle(w, h, i)
        );
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { w, h, particles } = state;

      ctx.clearRect(0, 0, w, h);

      // Radial pulse from center
      const now = Date.now() / 1000;
      const pulseScale = 0.5 + 0.5 * Math.sin(now * 0.4);
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.55);
      gradient.addColorStop(0, `rgba(234,179,8,${0.025 * pulseScale})`);
      gradient.addColorStop(0.55, `rgba(250,204,21,${0.01 * pulseScale})`);
      gradient.addColorStop(1, "rgba(234,179,8,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        // Drift
        p.x += p.vx;
        p.y += p.vy;

        // Gentle horizontal sway
        p.x += Math.sin(now * p.pulseSpeed * 60 + p.pulsePhase) * 0.12;

        // Pulse alpha
        p.alpha += p.alphaDelta * p.alphaDir;
        if (p.alpha > 0.55 || p.alpha < 0.04) p.alphaDir *= -1;

        // Wrap edges with fade margin
        if (p.y < -10) { p.y = h + 5; p.x = randomBetween(0, w); }
        if (p.y > h + 10) { p.y = -5; }
        if (p.x < -10) { p.x = w + 5; }
        if (p.x > w + 10) { p.x = -5; }

        // Draw glow
        const glowR = p.radius * 3.5;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        glow.addColorStop(0, rgba(p.color, p.alpha * 0.9));
        glow.addColorStop(0.4, rgba(p.color, p.alpha * 0.35));
        glow.addColorStop(1, rgba(p.color, 0));
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = rgba(p.color, Math.min(p.alpha * 1.6, 0.9));
        ctx.fill();
      }

      state.rafId = requestAnimationFrame(draw);
    };

    if (active) {
      state.rafId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(state.rafId);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  // Pause/resume when active changes without remounting
  useEffect(() => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!active) {
      cancelAnimationFrame(state.rafId);
      ctx.clearRect(0, 0, state.w, state.h);
    }
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[51]"
      aria-hidden
      style={{ willChange: "transform" }}
    />
  );
}

export const FlowParticleCanvas = memo(FlowParticleCanvasInner);
