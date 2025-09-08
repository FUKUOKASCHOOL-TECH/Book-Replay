import React, { useRef } from "react";
export default function LongPressCard({
  book,
  index,
  onLong,
  onDelete,
  onEdit,
}) {
  const hold = useRef(null);
  const start = () => {
    clearTimeout(hold.current);
    hold.current = setTimeout(() => onLong(), 800);
  };
  const cancel = () => {
    clearTimeout(hold.current);
  };
  return (
    <div
      style={{ marginTop: index === 0 ? 0 : -24, zIndex: 100 - index }}
      className="relative transition-all"
    >
      <div
        onMouseDown={start}
        onMouseUp={cancel}
        onMouseLeave={cancel}
        onTouchStart={start}
        onTouchEnd={cancel}
        className="rounded-2xl border p-4 shadow-xl group"
        style={{
          borderColor: "#d1d5db",
          backgroundColor: "white",
          boxShadow:
            "0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="w-6 h-6 rounded-full bg-blue-500/20 hover:bg-blue-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="編集"
          >
            <span className="text-blue-400 text-xs">✏</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="削除"
          >
            <span className="text-red-400 text-xs">×</span>
          </button>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-lg" style={{ color: "#374151" }}>
              {book.title}
            </div>
            <div className="text-sm" style={{ color: "#6b7280" }}>
              {book.author}
            </div>
            {book.pages > 0 && (
              <div className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                {book.pages}ページ
              </div>
            )}
          </div>
          <div
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: "#e5e7eb", color: "#6b7280" }}
          >
            長押しで読了
          </div>
        </div>
      </div>
    </div>
  );
}
