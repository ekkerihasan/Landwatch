import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "LANDWATCH — Land Acquisition Monitoring System",
  description:
    "Delay-risk monitoring and decision support for National Highway land acquisition.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream antialiased">
        <Sidebar />
        {/* Sidebar is fixed at 16rem on large screens; the shell offsets to clear it. */}
        <div className="lg:pl-64">
          {children}

          <footer className="border-t border-line bg-cream-alt">
            <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-6 py-5 text-[11px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                LANDWATCH · SIH26017 · Decision support for a human officer, not a
                decision-maker.
              </p>
              <p>
                Prototype on synthetic data. Not an official Government of India
                application.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
