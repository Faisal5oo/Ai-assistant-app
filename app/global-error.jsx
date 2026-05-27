"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * @param {Object} props
 * @param {Error & { digest?: string }} props.error
 * @param {() => void} props.reset
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-6 text-center text-charcoal">
          <div
            className="max-w-md rounded-4xl border border-white/60 bg-white/55 p-8 shadow-glass backdrop-blur-glass"
            style={{
              background:
                "linear-gradient(160deg, #fdfcf8 0%, #f9f7f2 45%, #f3efe6 100%)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b8860b]">
              Application error
            </p>
            <h1 className="mt-3 text-2xl font-semibold">TaskFlow needs a refresh</h1>
            <p className="mt-3 text-sm text-charcoal/50">
              {error.message ||
                "A critical error occurred. Reload the app or return home."}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-full bg-[#facc15] px-6 py-2.5 text-sm font-semibold text-charcoal hover:bg-[#eab308]"
              >
                Try again
              </button>
              <a
                href="/dashboard"
                className="rounded-full px-6 py-2.5 text-sm font-semibold text-charcoal/70 hover:text-charcoal"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
