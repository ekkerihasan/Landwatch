# Interface photographs

Drop three files in this folder, named **exactly** as below. Nothing else needs
changing — `lib/assets.ts` already points at these paths.

| Filename | Where it appears | What works best |
|---|---|---|
| `dashboard-hero.jpg` | Dashboard hero band | A wide expressway or corridor, open sky, horizon roughly a third down |
| `prediction-banner.jpg` | "AI-powered delay risk prediction" band | Highway construction, earthworks, survey equipment |
| `landing-hero.jpg` | Landing page hero | A highway running to the horizon |

## Notes

**Format.** `.jpg` is expected. If yours are `.png` or `.webp`, either rename them or
change the three `src` values in `frontend/lib/assets.ts`.

**Size.** Aim for roughly 2000px wide and under ~400KB each. These are background
bands, not gallery images — anything larger just slows the first paint.

**Crop.** Each band is short and very wide. Subject matter near the vertical centre
survives the crop; anything near the top or bottom edge will be cut. Steer the crop
per image with the `position` field in `assets.ts` (a standard CSS `object-position`,
e.g. `"center 40%"` to favour the upper part of the frame).

**Contrast is handled for you.** A dark institutional wash sits over every image, so
white text stays legible regardless of how bright the photograph is. Don't pre-darken
them.

**If a file is missing or fails to load**, that band falls back to the drawn highway
scene automatically. The page never shows a broken image, so a missing file is a
degraded look, not a broken demo.

## Licensing

Only use images you have the right to use. This is a prototype that presents itself
as public-infrastructure software, so an unlicensed photograph is a real risk rather
than a technicality. Public-domain or CC0 sources are the safe option.
