import { useEffect, useRef } from "react";

export const useEffectOnce = (effect: Function) => {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      effect();
      hasRun.current = true;
    }

    // Optional: Cleanup function if your effect returns one
    return () => {
      if (effect() && typeof effect() === "function") {
        return effect();
      }
    };
  }, []); // This empty array ensures the effect is run only on mount
};
