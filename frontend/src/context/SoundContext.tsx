import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface SoundContextValue {
  isMuted: boolean;
  toggleMute: () => void;
  playClick: () => void;
  playSuccess: () => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

const STORAGE_KEY = 'sound-muted';
const DEFAULT_VOLUME = 0.25;

function createTone(ctx: AudioContext, frequency: number, duration: number, volume: number) {
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently ignore audio errors
  }
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      audioCtxRef.current = new AudioContext();
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const playClick = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    createTone(ctx, 880, 0.08, DEFAULT_VOLUME); // ~80ms click tone
  }, [isMuted, getAudioContext]);

  const playSuccess = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    // Two-note success chime
    createTone(ctx, 523, 0.2, DEFAULT_VOLUME);  // C5
    setTimeout(() => createTone(ctx, 659, 0.3, DEFAULT_VOLUME), 150); // E5
  }, [isMuted, getAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playClick, playSuccess }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return ctx;
}

export default SoundProvider;
