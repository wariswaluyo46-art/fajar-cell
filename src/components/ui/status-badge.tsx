import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types";

interface StatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isReady = status === "ready";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shadow-sm backdrop-blur-md transition-all duration-300",
        isReady
          ? "border border-emerald-500/20 bg-emerald-600/90 text-white shadow-emerald-500/20"
          : "border border-rose-500/20 bg-rose-600/90 text-white shadow-rose-500/20",
        className,
      )}
    >
      <span className="relative flex size-2 shrink-0 items-center justify-center">
        {isReady && (
          <span
            className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-75"
            aria-hidden="true"
          />
        )}
        <span
          className={cn(
            "relative inline-flex size-1.5 rounded-full",
            isReady ? "bg-white" : "bg-white/90",
          )}
          aria-hidden="true"
        />
      </span>
      {PRODUCT_STATUS_LABELS[status]}
    </span>
  );
}
