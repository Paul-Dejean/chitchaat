import React, { useEffect, useRef, useState } from "react";

type DraggableBound =
  | {
      minX?: number;
      maxX?: number;
      minY?: number;
      maxY?: number;
    }
  | "parent";

interface DraggableProps {
  children: React.ReactNode;
  defaultX?: number;
  defaultY?: number;
  bound: DraggableBound;
  onDragStart?: () => void;
  onDrag?: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  scale?: number;
}

const DRAG_THRESHOLD = 5;

export const Draggable: React.FC<DraggableProps> = ({
  children,
  defaultX = 0,
  defaultY = 0,
  bound,
  onDragStart,
  onDrag,
  onDragEnd,
  scale = 1,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const draggingRef = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const hasClickedRef = useRef(false);

  useEffect(() => {
    const getBoundLimits = () => {
      if (bound === "parent" && ref.current) {
        const parent = getPositionedParent(ref.current);
        const parentRect = parent.getBoundingClientRect();
        const elementRect = ref.current.getBoundingClientRect();

        const offsetX = elementRect.left - parentRect.left;
        const offsetY = elementRect.top - parentRect.top;

        return {
          minX: position.x - offsetX,
          minY: position.y - offsetY,
          maxX: parent.clientWidth - elementRect.width + position.x - offsetX,
          maxY: parent.clientHeight - elementRect.height + position.y - offsetY,
        };
      } else if (typeof bound === "object") {
        return bound;
      }
      return {};
    };

    const element = ref.current;
    if (!element) return;

    const handleStart = (
      clientX: number,
      clientY: number,
      target: EventTarget | null
    ) => {
      if (target instanceof Element && target.closest("[data-nodrag]")) {
        return;
      }

      hasClickedRef.current = true;
      lastPosition.current = { x: clientX, y: clientY };
    };

    const handleMouseDown = (event: MouseEvent) => {
      handleStart(event.clientX, event.clientY, event.target);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      handleStart(touch.clientX, touch.clientY, event.target);
    };

    const handleClick = (e: MouseEvent) => {
      if (draggingRef.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!hasClickedRef.current) return;
      const deltaX = clientX - lastPosition.current.x;
      const deltaY = clientY - lastPosition.current.y;

      const movedEnough =
        Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD;

      if (!draggingRef.current && movedEnough) {
        draggingRef.current = true;
        onDragStart?.();
      }

      if (!draggingRef.current) return;

      let newX = position.x + deltaX;
      let newY = position.y + deltaY;

      const { minX, maxX, minY, maxY } = getBoundLimits();

      if (minX !== undefined) newX = Math.max(minX, newX);
      if (maxX !== undefined) newX = Math.min(maxX, newX);
      if (minY !== undefined) newY = Math.max(minY, newY);
      if (maxY !== undefined) newY = Math.min(maxY, newY);

      setPosition({ x: newX, y: newY });
      lastPosition.current = { x: clientX, y: clientY };
      onDrag?.(newX, newY);

      if (ref.current) {
        ref.current.style.transform = `translate(${newX}px, ${newY}px)`;
      }
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) =>
      handleMove(e.touches[0].clientX, e.touches[0].clientY);

    const handleEnd = () => {
      hasClickedRef.current = false;
      if (draggingRef.current) {
        setTimeout(() => {
          draggingRef.current = false;
        }, 0);

        onDragEnd?.(position.x, position.y);
      }
    };

    element.addEventListener("mousedown", handleMouseDown);
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("click", handleClick, true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchend", handleEnd);

    return () => {
      element.removeEventListener("mousedown", handleMouseDown);
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("click", handleClick, true);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [position, bound, onDrag, onDragStart, onDragEnd]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: "none",
        zIndex: 1000,
      }}
    >
      {children}
    </div>
  );
};

const getPositionedParent = (el: HTMLElement | null): HTMLElement => {
  let current = el?.parentElement;
  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    const style = window.getComputedStyle(current);
    if (["relative", "absolute", "fixed", "sticky"].includes(style.position)) {
      return current;
    }
    current = current.parentElement;
  }

  return document.body;
};
