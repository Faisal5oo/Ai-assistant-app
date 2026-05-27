"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * @param {Object} props
 * @param {Error & { digest?: string }} props.error
 * @param {() => void} props.reset
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <div className="glass-card max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark/90">
          Something went wrong
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-charcoal">
          We hit an unexpected error
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/50">
          {error.message || "The page could not be loaded. Try again or return to the dashboard."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="pill-btn-gold px-6 py-2.5 text-sm font-semibold"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="pill-btn-ghost px-6 py-2.5 text-sm font-semibold"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
