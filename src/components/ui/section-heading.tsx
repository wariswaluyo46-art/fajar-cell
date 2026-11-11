import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-2xl",
          align === "center" && "mx-auto text-center",
        )}
      >
        {eyebrow && (
          <div className="inline-flex items-center gap-1.5 mb-2">
            <span className="size-1.5 rounded-full bg-royal-600" aria-hidden="true" />
            <p className="text-xs font-bold tracking-[0.2em] text-royal-700 uppercase">
              {eyebrow}
            </p>
          </div>
        )}
        <h2
          className={cn(
            "text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl",
            titleClassName,
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
