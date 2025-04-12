import { useEffect, useState } from "react";
import hark from "hark";

export function useIsSpeaking(
  stream: MediaStream | null,
  options?: {
    threshold?: number;
    interval?: number;
    debounceMs?: number;
  }
) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const debounce = options?.debounceMs ?? 300;
  const threshold = options?.threshold ?? -65;
  const interval = options?.interval ?? 100;

  useEffect(() => {
    if (!stream || !stream.getAudioTracks()[0]) return;

    const speechEvents = hark(stream, {
      threshold,
      interval,
      play: false,
    });

    let lastSpoke = Date.now();
    let stopTimeout: NodeJS.Timeout;

    speechEvents.on("speaking", () => {
      clearTimeout(stopTimeout);
      setIsSpeaking(true);
      lastSpoke = Date.now();
    });

    speechEvents.on("stopped_speaking", () => {
      const now = Date.now();
      const wait = Math.max(debounce - (now - lastSpoke), 0);
      stopTimeout = setTimeout(() => setIsSpeaking(false), wait);
    });

    return () => {
      clearTimeout(stopTimeout);
      speechEvents.stop();
    };
  }, [stream, threshold, interval, debounce]);

  return isSpeaking;
}
