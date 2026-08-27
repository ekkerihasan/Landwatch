/**
 * Image slots for the interface.
 *
 * Every photographic slot is declared here so real photographs can be dropped in by
 * editing ONE file. Nothing else in the codebase references an image URL.
 *
 * Why they are empty by default:
 *   - We have no licensed photographs of Indian highway construction, and shipping
 *     unlicensed ones into a government-facing prototype is not a risk worth taking.
 *   - A remote image URL is a network dependency. A demo venue with bad wifi would
 *     show broken frames at the exact moment it matters.
 *
 * With a slot empty, the section falls back to a rendered infrastructure treatment
 * (drawn highway + institutional wash) that always works offline. Set a slot and the
 * photograph appears behind the same wash, so text contrast is preserved either way.
 *
 * To use real photographs:
 *   1. Drop files into frontend/public/images/
 *   2. Point the slot at them, e.g. dashboardHero: "/images/expressway.jpg"
 *   Remote URLs work too, but see the caveat above.
 */

export interface ImageSlot {
  /** Public path or absolute URL. Empty string = use the drawn fallback. */
  src: string;
  /** Describe the photograph for screen readers. Ignored when src is empty. */
  alt: string;
  /** CSS object-position, for steering the crop on wide hero frames. */
  position?: string;
}

export const IMAGES: Record<string, ImageSlot> = {
  /** Dashboard hero — a wide expressway or corridor under an open sky. */
  dashboardHero: {
    src: "",
    alt: "National highway corridor under construction",
    position: "center 60%",
  },

  /** Delay-prediction banner — highway construction, earthworks, survey equipment. */
  predictionBanner: {
    src: "",
    alt: "Highway construction works in progress",
    position: "center 55%",
  },

  /** Landing page hero. */
  landingHero: {
    src: "",
    alt: "National highway stretching to the horizon",
    position: "center 65%",
  },
};

export function hasPhoto(slot: ImageSlot): boolean {
  return slot.src.trim().length > 0;
}
