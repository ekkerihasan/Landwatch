/**
 * The hero illustration: a highway corridor receding to the horizon.
 *
 * Drawn rather than photographed on purpose — no licensing question, nothing fetched
 * over the network (so it still renders at a venue with bad wifi), and it scales to
 * any screen without artefacts. The lane markings animate toward the viewer, which is
 * the only motion in the scene.
 */
export function HighwayScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 460"
      className={className}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="lw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1220" stopOpacity="0" />
          <stop offset="100%" stopColor="#1a2740" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="lw-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#243350" />
          <stop offset="100%" stopColor="#0d1524" />
        </linearGradient>
        <linearGradient id="lw-horizon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5a524" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f5a524" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lw-ridge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2740" />
          <stop offset="100%" stopColor="#111a2b" />
        </linearGradient>
        {/* The road fades out before the top so it blends into the hero gradient. */}
        <linearGradient id="lw-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="35%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="lw-roadmask">
          <rect x="0" y="0" width="1440" height="460" fill="url(#lw-fade)" />
        </mask>
      </defs>

      <rect width="1440" height="460" fill="url(#lw-sky)" />

      {/* Horizon glow, sitting where the road vanishes */}
      <ellipse cx="720" cy="150" rx="360" ry="70" fill="url(#lw-horizon)" />

      {/* Distant ridgeline — a flat horizon reads as empty */}
      <path
        d="M0 168 L120 150 L210 162 L330 132 L430 155 L540 140 L640 158 L720 148 L810 160 L910 138 L1020 158 L1130 144 L1240 162 L1340 150 L1440 166 L1440 200 L0 200 Z"
        fill="url(#lw-ridge)"
      />

      <g mask="url(#lw-roadmask)">
        {/* Carriageway, narrowing to the vanishing point */}
        <path d="M660 150 L780 150 L1180 460 L260 460 Z" fill="url(#lw-road)" />

        {/* Shoulder edges */}
        <path d="M660 150 L664 150 L286 460 L262 460 Z" fill="#e2e8f0" opacity="0.30" />
        <path d="M776 150 L780 150 L1178 460 L1154 460 Z" fill="#e2e8f0" opacity="0.30" />

        {/* Centre line — the animated element */}
        <line
          x1="720"
          y1="150"
          x2="720"
          y2="460"
          stroke="#f5a524"
          strokeWidth="5"
          strokeDasharray="26 30"
          className="lw-lane-dash"
          opacity="0.92"
        />

        {/* Inner lane divisions, fainter and offset so the road reads as multi-lane */}
        <line
          x1="694"
          y1="150"
          x2="500"
          y2="460"
          stroke="#cbd5e1"
          strokeWidth="2.5"
          strokeDasharray="18 26"
          className="lw-lane-dash"
          opacity="0.28"
        />
        <line
          x1="746"
          y1="150"
          x2="940"
          y2="460"
          stroke="#cbd5e1"
          strokeWidth="2.5"
          strokeDasharray="18 26"
          className="lw-lane-dash"
          opacity="0.28"
        />
      </g>

      {/* Survey markers along the corridor — the acquisition, not the road */}
      <g opacity="0.55">
        <circle cx="352" cy="404" r="4" fill="#2dd4bf" />
        <circle cx="1084" cy="404" r="4" fill="#2dd4bf" />
        <circle cx="470" cy="300" r="3" fill="#f5a524" />
        <circle cx="968" cy="300" r="3" fill="#f5a524" />
        <circle cx="556" cy="232" r="2.5" fill="#94a3b8" />
        <circle cx="884" cy="232" r="2.5" fill="#94a3b8" />
      </g>
    </svg>
  );
}
