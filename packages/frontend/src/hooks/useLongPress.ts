import { useRef, useCallback } from "react";

type UseLongPressProps = {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
};

type UseLongPressOptions = {
  onLongPress: () => void;
  delay?: number;
};

export function useLongPress({
  onLongPress,
  delay = 500,
}: UseLongPressOptions): UseLongPressProps {
  const timerRef = useRef<number>(0);
  const triggeredRef = useRef(false);
  const startTouchRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      console.log("touchStart");
      const touch = e.touches[0];
      triggeredRef.current = false;
      startTouchRef.current = { x: touch.clientX, y: touch.clientY };

      timerRef.current = window.setTimeout(() => {
        onLongPress();
        triggeredRef.current = true;
      }, delay);
    },
    [onLongPress, delay]
  );

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    clearTimeout(timerRef.current);
    if (triggeredRef.current) {
      e.preventDefault();
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const start = startTouchRef.current;
    if (!start) return;

    const dx = Math.abs(touch.clientX - start.x);
    const dy = Math.abs(touch.clientY - start.y);
    const moved = dx > 10 || dy > 10;

    if (moved) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
  };
}
