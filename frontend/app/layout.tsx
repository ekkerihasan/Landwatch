import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LANDWATCH — Land acquisition delay risk",
  description: "Predictive analytics for early detection of land acquisition delays",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">
        <header className="sticky top-0 z-[500] border-b border-slate-200 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-[11px] font-bold text-white">
                LW
              </span>
              <span className="text-base font-semibold tracking-tight text-slate-900">LANDWATCH</span>
            </Link>

            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className="rounded px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Dashboard
              </Link>
              <Link
                href="/projects/new"
                className="rounded px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Assess a site
              </Link>
              <span className="ml-2 hidden rounded bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200 sm:inline">
                Synthetic data
              </span>
            </nav>
          </div>
        </header>

        {children}

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              LANDWATCH · SIH26017 · Decision support for a human officer, not a decision-maker.
            </p>
            <p>All data shown is synthetic and labelled as such.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
