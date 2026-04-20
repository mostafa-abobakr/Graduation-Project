export function ViewToggler({
  viewMode,
  setViewMode,
  modes = ["today", "week", "month"],
  labels,
  className = "",
}) {
  return (
    <div
      className={`relative grid bg-muted/60 p-1.5 rounded-xl w-full sm:w-max min-w-[280px] shadow-inner border border-border/40 ${className}`}
      style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}
    >
      <div
        className="absolute top-1.5 bottom-1.5 bg-background rounded-lg shadow transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 12px) / ${modes.length})`,
          left: "6px",
          transform: `translateX(calc(${modes.indexOf(viewMode)} * 100%))`,
        }}
      />
      {modes.map((mode, index) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          aria-pressed={viewMode === mode}
          className={`relative z-10 py-1 px-3 whitespace-nowrap text-[13px] font-bold tracking-wide capitalize transition-colors duration-200 ${
            viewMode === mode
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {labels ? labels[index] : mode}
        </button>
      ))}
    </div>
  );
}
