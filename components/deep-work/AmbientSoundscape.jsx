"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { SOUNDSCAPES } from "@/lib/deepWorkConstants";
import { getSoundscapeLoopUrl } from "@/lib/deepWorkAudio";

/**
 * @param {Object} props
 * @param {boolean} props.active
 */
export function AmbientSoundscape({ active }) {
  const [trackId, setTrackId] = useState(
    /** @type {import('@/lib/deepWorkConstants').SoundscapeId} */ ("binaural")
  );
  const [volume, setVolume] = useState(0.35);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(/** @type {HTMLAudioElement | null} */ (null));

  const loadTrack = useCallback(
    (id) => {
      const audio = audioRef.current;
      if (!audio) return;
      const wasPlaying = !audio.paused;
      audio.pause();
      audio.src = getSoundscapeLoopUrl(id);
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
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <div className="rounded-3xl border border-white/70 bg-white/50 px-5 py-4 shadow-glass backdrop-blur-glass">
      <audio ref={audioRef} preload="auto" />
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-charcoal/40">
        Ambient soundscape
      </p>
      <div className="flex flex-wrap gap-2">
        {SOUNDSCAPES.map((scape) => (
          <button
            key={scape.id}
            type="button"
            onClick={() => setTrackId(scape.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              trackId === scape.id
                ? "bg-charcoal text-white"
                : "bg-white/80 text-charcoal/60 hover:text-charcoal"
            }`}
            title={scape.description}
          >
            {scape.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-charcoal/70 transition hover:text-charcoal"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-charcoal/10 accent-gold"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
