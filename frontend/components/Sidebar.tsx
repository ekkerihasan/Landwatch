"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Emblem, Wordmark } from "./Brand";

/**
 * Primary navigation.
 *
 * Destinations that exist are links. Destinations that do not are shown as planned
 * rather than omitted — a dead link a judge clicks during a demo is worse than an
 * honest "not built yet", and hiding them would understate the intended scope.
 */
type Item = { label: string; href?: string; icon: JSX.Element };

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px] shrink-0">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LIVE: Item[] = [
  { label: "Dashboard", href: "/dashboard", icon: icon("M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z") },
  { label: "Projects", href: "/projects", icon: icon("M4 6h16M4 12h16M4 18h10") },
  { label: "Map View", href: "/map", icon: icon("m9 4-6 3v13l6-3 6 3 6-3V4l-6 3zM9 4v13M15 7v13") },
  { label: "Risk Analysis", href: "/projects/new", icon: icon("M3 20h18M6 16V9M11 16V5M16 16v-4M21 16v-8") },
];

const PLANNED: Item[] = [
  { label: "Alerts", icon: icon("M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zM10 19a2 2 0 0 0 4 0") },
  { label: "Reports", icon: icon("M8 3h8l4 4v14H4V3zM14 3v5h5") },
  { label: "Documents", icon: icon("M4 4h9l5 5v11H4zM13 4v5h5M8 14h8M8 17h5") },
  { label: "Settings", icon: icon("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 3h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.4L6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z") },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const nav = (
    <nav className="flex h-full flex-col">
      <Link
        href="/"
        className="flex items-center gap-3 border-b border-white/10 px-5 py-4 text-cream-surface"
        onClick={() => setOpen(false)}
      >
        <Emblem className="h-10 w-10 shrink-0 text-cream-surface" />
        <Wordmark />
      </Link>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Monitoring
        </p>
        <ul className="space-y-0.5">
          {LIVE.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href!}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                  isActive(item.href!)
                    ? "bg-white/12 font-semibold text-white"
                    : "text-white/70 hover:bg-white/6 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <p className="px-2 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Planned
        </p>
        <ul className="space-y-0.5">
          {PLANNED.map((item) => (
            <li
              key={item.label}
              className="flex cursor-not-allowed items-center gap-3 rounded px-3 py-2 text-sm text-white/30"
              title="Not built in this prototype"
            >
              {item.icon}
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-white/50">
          Infrastructure monitoring prototype
        </p>
        <p className="mt-1.5 inline-block rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
          Synthetic data
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-white/35">
          Not an official Government of India application.
        </p>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile / tablet bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-forest-800 px-4 py-3 text-cream-surface lg:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="rounded p-1.5 hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
        <Emblem className="h-7 w-7 text-cream-surface" />
        <span className="text-sm font-bold tracking-tight">LANDWATCH</span>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-forest-900/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`lw-grain fixed inset-y-0 left-0 z-50 w-64 bg-forest-800 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
