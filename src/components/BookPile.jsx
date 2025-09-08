import React, { useEffect, useState } from "react";
export default function BookPile({ count }) {
  const [tick, setTick] = useState(0);
  const severity = count === 0 ? 0 : count < 3 ? 1 : count < 7 ? 2 : 3;
  useEffect(() => {
    if (severity < 2) return;
    const id = setInterval(
      () => setTick((t) => t + 1),
      severity === 2 ? 1000 : 600
    );
    return () => clearInterval(id);
  }, [severity]);
  const visible = Math.min(count, 42);
  const items = Array.from({ length: visible }, (_, i) => i);
  return (
    <div
      className="relative h-56 md:h-64 rounded-2xl border overflow-hidden"
      style={{
        borderColor: "#d1d5db",
        backgroundColor: "#fef3c7",
        boxShadow:
          "0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        className="absolute bottom-2 left-0 right-0 h-3"
        style={{ backgroundColor: "rgba(209, 213, 219, 0.4)" }}
      />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full flex items-end justify-center">
        <div className="relative" style={{ width: "620px", maxWidth: "95%" }}>
          {items.map((i) => {
            const baseRot = (i % 2 ? -1 : 1) * (1.5 + (i % 6));
            const wobble =
              severity === 3
                ? Math.sin((tick + i) * 0.8) * 2.0
                : severity === 2
                ? Math.sin((tick + i) * 0.5) * 0.6
                : 0;
            const width = Math.max(110, 260 - i * 4.0);
            const y = i * 9.5;
            const xShift = severity === 3 ? Math.sin((tick + i) * 0.55) * 4 : 0;
            return (
              <div
                key={i}
                className="absolute left-1/2 origin-bottom rounded-md shadow-xl"
                style={{
                  width: width + "px",
                  height: "16px",
                  transform: `translate(calc(-50% + ${xShift}px), -${y}px) rotate(${
                    baseRot + wobble
                  }deg)`,
                  borderColor: "#9ca3af",
                  backgroundColor: "#d1d5db",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
              >
                <div
                  className="h-full w-2"
                  style={{ backgroundColor: "rgba(156, 163, 175, 0.7)" }}
                />
              </div>
            );
          })}
        </div>
      </div>
      {severity === 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm flex items-center gap-2"
          style={{ color: "#6b7280" }}
        >
          <span className="text-2xl">📚</span>スッキリ！未読なし
        </div>
      )}
      {severity === 3 && (
        <div className="absolute right-6 bottom-16">
          <span
            className="inline-block w-3 h-3 rounded-full animate-ping"
            style={{ backgroundColor: "rgba(156, 163, 175, 0.7)" }}
          />
        </div>
      )}
      <div
        className="absolute top-2 left-4 text-xs flex items-center gap-2"
        style={{ color: "#6b7280" }}
      >
        <span className="text-lg">📚</span>未読 {count} 冊
      </div>
    </div>
  );
}
