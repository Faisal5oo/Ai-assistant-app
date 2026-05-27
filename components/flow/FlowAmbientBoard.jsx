"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { FLOW_SOUNDSCAPES } from "@/lib/flowConstants";
import { getFlowSoundscapeUrl } from "@/lib/flowAudio";

/**
 * @param {Object} props
 * @param {boolean} props.active
 */
export function FlowAmbientBoard({ active }) {
  const [trackId, setTrackId] = useState(
    /** @type {import('@/lib/flowConstants').FlowSoundscapeId} */ ("binaural-alpha")
  );
  const [volume, setVolume] = useState(0.32);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(/** @type {HTMLAudioElement | null} */ (null));

  const loadTrack = useCallback(
    (id) => {
      const audio = audioRef.current;
      if (!audio) return;
      const wasPlaying = !audio.paused;
      audio.pause();
      audio.src = getFlowSoundscapeUrl(id);
      audio.loop = true;
      audio.volume = muted ? 0 : volume;
      if (wasPlaying && active) {
        void audio.play().catch(() => {});
      }
    },
    [active, muted, volume]
  );

  useEffect(() => {
    loadTrack(trackId);
  }, [trackId, loadTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (active && !muted) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [active, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  return (
    <div className="w-full max-w-2xl rounded-full border border-white/60 bg-white/40 px-4 py-3 shadow-glass backdrop-blur-glass">
      <audio ref={audioRef} preload="auto" />
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
        {FLOW_SOUNDSCAPES.map((scape) => (
          <button
            key={scape.id}
            type="button"
            onClick={() => setTrackId(scape.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition ${
              trackId === scape.id
                ? "bg-charcoal text-white"
                : "bg-white/70 text-charcoal/55 hover:text-charcoal"
            }`}
            title={scape.description}
          >
            {scape.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-charcoal/60 transition hover:text-charcoal"
          aria-label={muted ? "Unmute ambient" : "Mute ambient"}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-charcoal/10 accent-gold md:w-28"
          aria-label="Ambient volume"
        />
      </div>
    </div>
  );
}
