/**
 * Image slots for the interface.
 *
 * Every photographic slot is declared here so photographs can be swapped by editing
 * ONE file. Nothing else in the codebase references an image URL.
 *
 * A slot with an empty `src`, or one whose file is missing or fails to load, falls
 * back to the drawn highway scene behind the same institutional wash. Text contrast
 * is identical either way, so a missing file is a degraded look, never a broken frame.
 *
 * To change a photograph: drop a file into frontend/public/images/ and point the slot
 * at it. See the README in that folder.
 */

export interface ImageSlot {
  /** Public path or absolute URL. Empty string = use the drawn fallback. */
  src: string;
  /** Describe the photograph for screen readers. Ignored when src is empty. */
  alt: string;
  /**
   * CSS object-position, for steering the crop.
   *
   * These bands are short and very wide, so a square or portrait source is cropped
   * hard top and bottom. The second value picks which horizontal slice survives:
   * a lower percentage keeps the upper part of the frame.
   */
  position?: string;
}

export const IMAGES: Record<string, ImageSlot> = {
  /**
   * Dashboard hero. Aerial interchange, 736x736 square.
   * The flyover and the converging carriageways sit just below centre, so the crop
   * favours the lower-middle band.
   */
  dashboardHero: {
    src: "/images/dashboard-hero.jpg",
    alt: "Aerial view of a national highway interchange with an elevated flyover",
    position: "center 58%",
  },

  /**
   * Delay-prediction banner.
   *
   * Deliberately empty: no clean construction photograph is available yet, and the
   * dashboard already carries the interchange above — a second copy of the same
   * image on one page reads as padding. The drawn scene gives the band its own
   * character. Drop a construction photo in as prediction-banner.jpg to fill it.
   */
  predictionBanner: {
    src: "",
    alt: "Highway construction works in progress",
    position: "center 55%",
  },

  /**
   * Landing hero. Aerial expressway with a national flag, 736x856 portrait.
   * The flag and the horizon are in the upper third, so the crop is pulled up to
   * keep them rather than showing only tarmac.
   */
  landingHero: {
    src: "/images/landing-hero.jpg",
    alt: "Aerial view of a national expressway with service roads and a national flag",
    position: "center 32%",
  },
};

export function hasPhoto(slot: ImageSlot): boolean {
  return slot.src.trim().length > 0;
}
