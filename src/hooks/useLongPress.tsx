import { useRef, useCallback } from "react";

export const useLongPress = (onLongPress: () => void, delay = 500) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(() => {
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
  };
};

interface LongPressFieldProps {
  field: string;
  label: string;
  value: string;
  onLongPress: (field: string, label: string) => void;
}

export const LongPressField = ({ field, label, value, onLongPress }: LongPressFieldProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(() => {
      onLongPress(field, label);
    }, 500);
  }, [field, label, onLongPress]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <div className="flex items-center gap-4 py-0.5 text-base">
      <span className="text-right w-32 flex-shrink-0" style={{ color: 'rgb(153, 152, 153)' }}>{label}</span>
      <span
        className="cursor-pointer hover:text-primary flex-1 select-none"
        style={{ color: 'rgb(52, 51, 51)' }}
        onMouseDown={start}
        onMouseUp={clear}
        onMouseLeave={clear}
        onTouchStart={start}
        onTouchEnd={clear}
        onTouchMove={clear}
      >
        {value}
      </span>
    </div>
  );
};
