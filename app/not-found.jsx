import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <div className="glass-card max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark/90">
          404
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-charcoal">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-charcoal/50">
          This route does not exist. Head back to your dashboard or productivity hub.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className="pill-btn-gold px-6 py-2.5 text-sm font-semibold">
            Dashboard
          </Link>
          <Link
            href="/productivity"
            className="pill-btn-ghost px-6 py-2.5 text-sm font-semibold"
          >
            Techniques
          </Link>
        </div>
      </div>
    </div>
  );
}
