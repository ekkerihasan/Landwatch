import type { ImageSlot } from "@/lib/assets";
import { hasPhoto } from "@/lib/assets";
import { HighwayScene } from "./HighwayScene";

/**
 * A dark institutional band that holds content over infrastructure imagery.
 *
 * If the slot in lib/assets.ts has a photograph it is used; otherwise the drawn
 * highway stands in. Either way the same wash sits on top, so text contrast is
 * identical and swapping in a photo can never make the copy unreadable.
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
  return (
    <section className={`lw-forest lw-grain relative overflow-hidden ${className}`}>
      {hasPhoto(slot) ? (
        // Plain img, not next/image: the source may be a public path or a remote URL
        // set by whoever swaps the asset in, and next/image would need config for both.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slot.src}
          alt={slot.alt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: slot.position ?? "center" }}
        />
      ) : (
        <HighwayScene
          className={`pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-70 ${drawnScale}`}
        />
      )}

      {/* Wash — applied over photo and drawing alike */}
      <div className="lw-photo-wash absolute inset-0" aria-hidden />
      <div className="lw-grid absolute inset-0 opacity-50" aria-hidden />

      <div className="relative">{children}</div>
    </section>
  );
}
