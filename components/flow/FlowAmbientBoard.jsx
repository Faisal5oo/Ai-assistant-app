"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, ChevronDown, Loader2 } from "lucide-react";
import { FLOW_SOUNDSCAPES } from "@/lib/flowConstants";
import {
  getFlowAudioElement,
  releaseFlowAudioExcept,
  releaseAllFlowAudio,
} from "@/lib/flowAudio";

const DEFAULT_TRACK_ID = "lofi-piano";
const DEFAULT_VOLUME = 0.32;

/**
 * Ambient Soundscape System for the Flow State Engine.
 *
 * Each track is rendered once via OfflineAudioContext (off main thread) and
 * cached as a loopable HTMLAudioElement. The HTMLAudioElement itself is the
 * only thing touching the audio hardware, so no frame drops occur in the
 * 60fps FlowParticleCanvas running alongside this widget.
 *
 * Track switching fully releases inactive Audio elements and revokes their
 * blob URLs to prevent memory leaks across long focus sessions.
 *
 * @param {{ active: boolean }} props
 */
export function FlowAmbientBoard({ active }) {
  const [trackId, setTrackId] = useState(DEFAULT_TRACK_ID);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [userStarted, setUserStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ref to the currently active HTMLAudioElement
  const audioRef = useRef(/** @type {HTMLAudioElement | null} */ (null));
  // Track which ID is currently loaded to avoid double-init
  const loadedIdRef = useRef(/** @type {string | null} */ (null));
  // Prevent stale async results from a previous track load from racing
  const loadGenRef = useRef(0);

  // ── Core: load (or retrieve from pool) an Audio element for the given id ──
  const loadTrack = useCallback(
    async (id, shouldPlay) => {
      // If already loaded and same track, just handle play state
      if (loadedIdRef.current === id && audioRef.current) {
        const el = audioRef.current;
        el.volume = muted ? 0 : volume;
        if (shouldPlay && el.paused) {
          void el.play().catch(() => {});
        }
        return;
      }

      const gen = ++loadGenRef.current;
      setLoading(true);

      try {
        // Pause and detach the previous element first
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        // Release inactive tracks before loading the next one
        releaseFlowAudioExcept(id);

        const el = await getFlowAudioElement(id);

        // Guard: if another load started while we were awaiting, abort
        if (gen !== loadGenRef.current) return;

        el.loop = true;
        el.volume = muted ? 0 : volume;
        audioRef.current = el;
        loadedIdRef.current = id;

        if (shouldPlay) {
          void el.play().catch(() => {});
        }
      } finally {
        if (gen === loadGenRef.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentionally stable — volume/muted are read at call-time via closure
  );

  // ── Sync volume to the current audio element whenever volume/muted change ──
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // ── Track change: reload and resume if playing ─────────────────────────────
  useEffect(() => {
    void loadTrack(trackId, isPlaying && active && !muted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  // ── active prop: pause on session end, preserve intent on resume ───────────
  useEffect(() => {
    const el = audioRef.current;
    if (!active) {
      el?.pause();
      return;
    }
    // Session resumed — prime the default track if nothing is loaded yet
    if (!loadedIdRef.current) {
      void loadTrack(trackId, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ── Cleanup: release everything on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      loadGenRef.current = -1; // poison all in-flight loads
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      releaseAllFlowAudio();
    };
  }, []);

  // ── Play / Pause ──────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(async () => {
    if (!userStarted) setUserStarted(true);
    if (loading) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    // If not yet loaded, load now (first user interaction)
    if (!loadedIdRef.current || loadedIdRef.current !== trackId) {
      setIsPlaying(true);
      await loadTrack(trackId, true);
      return;
    }

    const el = audioRef.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
    void el.play().catch(() => {});
    setIsPlaying(true);
  }, [isPlaying, loading, userStarted, trackId, muted, volume, loadTrack]);

  // ── Track selection ────────────────────────────────────────────────────────
  const handleTrackSelect = useCallback(
    (id) => {
      if (id === trackId || loading) return;
      loadedIdRef.current = null; // force reload
      setTrackId(id);
      setExpanded(false);
    },
    [trackId, loading]
  );

  // ── Mute toggle ───────────────────────────────────────────────────────────
  const handleMuteToggle = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      const el = audioRef.current;
      if (el) el.volume = next ? 0 : volume;
      return next;
    });
  }, [volume]);

  // ── Volume slider ─────────────────────────────────────────────────────────
  const handleVolumeChange = useCallback(
    (e) => {
      const v = Number(e.target.value);
      setVolume(v);
      const el = audioRef.current;
      if (el) {
        // Unmute automatically when user drags the slider above 0
        if (muted && v > 0) {
          setMuted(false);
          el.volume = v;
        } else {
          el.volume = muted ? 0 : v;
        }
      }
    },
    [muted]
  );

  const currentScape =
    FLOW_SOUNDSCAPES.find((s) => s.id === trackId) ?? FLOW_SOUNDSCAPES[0];

  return (
    <div className="w-full max-w-2xl">
      {/* ── Main control bar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/45 px-4 py-3 shadow-glass backdrop-blur-glass">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={loading}
          aria-label={isPlaying ? "Pause ambient sound" : "Play ambient sound"}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-60 ${
            isPlaying
              ? "bg-charcoal text-white shadow-[0_4px_12px_rgba(26,26,26,0.25)]"
              : "bg-charcoal/10 text-charcoal/60 hover:bg-charcoal/15 hover:text-charcoal"
          }`}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={14} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
        </button>

        {/* Track selector */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          disabled={loading}
          className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-60"
        >
          <span className="text-sm font-semibold text-charcoal/20 w-4 text-center leading-none">
            {currentScape.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold tracking-wide text-charcoal/75">
              {currentScape.label}
            </p>
            {loading && (
              <p className="text-[9px] tracking-wider text-charcoal/35 uppercase font-medium mt-0.5">
                Rendering audio…
              </p>
            )}
            {!loading && !isPlaying && !userStarted && (
              <p className="text-[9px] tracking-wider text-charcoal/35 uppercase font-medium mt-0.5">
                Tap ▶ to start
              </p>
            )}
            {!loading && isPlaying && (
              <p className="text-[9px] tracking-wider text-emerald-600/60 uppercase font-medium mt-0.5 flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Playing
              </p>
            )}
          </div>
          <ChevronDown
            size={13}
            className={`shrink-0 text-charcoal/35 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Mute toggle */}
        <button
          type="button"
          onClick={handleMuteToggle}
          aria-label={muted ? "Unmute" : "Mute"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-charcoal/40 transition hover:bg-charcoal/10 hover:text-charcoal"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        {/* Volume slider — linear mapping directly to audio.volume */}
        <div className="flex w-20 shrink-0 items-center sm:w-28">
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-charcoal/12 accent-charcoal"
            aria-label="Ambient volume"
          />
        </div>
      </div>

      {/* ── Track dropdown ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="track-dropdown"
            initial={{ opacity: 0, y: -6, scaleY: 0.94 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
            className="mt-1.5 overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-glass backdrop-blur-glass"
          >
            {FLOW_SOUNDSCAPES.map((scape, i) => (
              <button
                key={scape.id}
                type="button"
                onClick={() => handleTrackSelect(scape.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  i < FLOW_SOUNDSCAPES.length - 1 ? "border-b border-white/40" : ""
                } ${trackId === scape.id ? "bg-charcoal/8" : "hover:bg-charcoal/5"}`}
              >
                <span className="text-base leading-none text-charcoal/30 font-semibold w-5 text-center">
                  {scape.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-wide text-charcoal/80 truncate">
                    {scape.label}
                  </p>
                  <p className="text-[9px] tracking-wide text-charcoal/40 mt-0.5 truncate">
                    {scape.description}
                  </p>
                </div>
                {trackId === scape.id && (
                  <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-charcoal/50" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
