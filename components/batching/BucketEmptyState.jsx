"use client";

/**
 * @param {Object} props
 * @param {import('lucide-react').LucideIcon} props.icon
 */
export function BucketEmptyState({ icon: Icon }) {
  return (
    <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-3xl border border-dashed border-charcoal/10 bg-white/30 px-4 py-8 text-center transition-colors duration-300">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-charcoal/[0.04] text-charcoal/30 opacity-30 transition-all duration-300 group-[.batch-drop-active]:scale-110 group-[.batch-drop-active]:bg-gold/25 group-[.batch-drop-active]:text-gold-dark group-[.batch-drop-active]:opacity-100 group-[.batch-drop-active]:shadow-[0_0_28px_rgba(250,204,21,0.45)]">
        <Icon size={26} strokeWidth={1.5} />
      </div>
      <p className="text-xs text-charcoal/45">Drop tasks here</p>
      <p className="mt-1 text-[11px] text-charcoal/35 group-[.batch-drop-active]:text-charcoal/55">
        <span className="group-[.batch-drop-active]:hidden">Drag from pool or another bucket</span>
        <span className="hidden group-[.batch-drop-active]:inline">Release to batch</span>
      </p>
    </div>
  );
}
