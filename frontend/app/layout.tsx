import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LandWatch — Risk Dashboard",
  description: "Predictive analytics for early detection of land acquisition delays",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-sm font-bold text-white">
                LW
              </div>
              <span className="text-lg font-semibold tracking-tight">LANDWATCH</span>
              <span className="hidden rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 sm:inline">
                Prototype — Synthetic data
              </span>
            </div>
            <nav className="text-sm text-slate-500">SIH26017 • Risk Dashboard</nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-slate-400">
          Data shown is synthetic/demo only — clearly labelled as per PRD §6 &amp; Design Brief §4.
        </footer>
      </body>
    </html>
  );
}
