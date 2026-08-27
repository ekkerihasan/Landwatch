"use client";

import { useState } from "react";
import type { ImageSlot } from "@/lib/assets";
import { hasPhoto } from "@/lib/assets";
import { HighwayScene } from "./HighwayScene";

/**
 * A dark institutional band that holds content over infrastructure imagery.
 *
 * If the slot in lib/assets.ts names a photograph it is used; otherwise — or if that
 * file is missing or fails to load — the drawn highway stands in. The same wash sits
 * on top either way, so text contrast is identical and a swapped-in photo can never
 * make the copy unreadable, nor a missing one show a broken frame mid-demo.
 */
export function PhotoFrame({
  slot,
  children,
  className = "",
  drawnScale = "h-full",
}: {
  slot: ImageSlot;
  children: React.ReactNode;
  className?: string;
  drawnScale?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = hasPhoto(slot) && !failed;

  return (
    <section className={`lw-forest lw-grain relative overflow-hidden ${className}`}>
      {showPhoto ? (
        // Plain img, not next/image: the source may be a public path or a remote URL
        // set by whoever swaps the asset in, and next/image would need config for both.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slot.src}
          alt={slot.alt}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: slot.position ?? "center" }}
        />
      ) : (
        <HighwayScene
          className={`pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-70 ${drawnScale}`}
        />
      )}

      {/* Wash — applied over photograph and drawing alike */}
      <div className="lw-photo-wash absolute inset-0" aria-hidden />
      <div className="lw-grid absolute inset-0 opacity-50" aria-hidden />

      <div className="relative">{children}</div>
    </section>
  );
}
