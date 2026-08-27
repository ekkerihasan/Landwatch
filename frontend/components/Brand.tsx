/**
 * The LANDWATCH mark.
 *
 * A surveyor's reference: the Ashoka-style radiating rule inside a bounded field,
 * over a road centre-line. Deliberately NOT the State Emblem — this is a prototype
 * and must not present itself as an official Government of India application.
 */
export function Emblem({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      {/* Bounded field */}
      <circle cx="20" cy="20" r="18.5" fill="currentColor" opacity="0.1" />
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />

      {/* Survey radials */}
      <g stroke="currentColor" strokeWidth="0.9" opacity="0.55">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          return (
            <line
              key={i}
              x1={20 + Math.cos(a) * 10}
              y1={20 + Math.sin(a) * 10}
              x2={20 + Math.cos(a) * 13.6}
              y2={20 + Math.sin(a) * 13.6}
            />
          );
        })}
      </g>

      {/* Corridor narrowing to a vanishing point — the thing being watched */}
      <path d="M13.4 30 L18.4 12 L21.6 12 L26.6 30 Z" fill="currentColor" opacity="0.9" />
      <line
        x1="20"
        y1="13"
        x2="20"
        y2="29"
        stroke="#f7f4ed"
        strokeWidth="1.5"
        strokeDasharray="2.4 2.6"
      />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="min-w-0">
      <span className="block text-[15px] font-bold leading-none tracking-tight">LANDWATCH</span>
      {!compact && (
        <>
          <span className="mt-1 block text-[11px] leading-none opacity-80">भूमि प्रहरी</span>
          <span className="mt-1 block text-[10px] leading-tight opacity-60">
            Land Acquisition Monitoring System
          </span>
        </>
      )}
    </span>
  );
}
