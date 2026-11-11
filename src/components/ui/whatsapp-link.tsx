import { MessageCircle } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type WhatsAppVariant = "primary" | "outline" | "ghost";
type WhatsAppSize = "sm" | "md" | "lg";

const variantClasses: Record<WhatsAppVariant, string> = {
  primary:
    "bg-wa-gradient text-white shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-emerald-600",
  outline:
    "border border-emerald-500/30 bg-white/90 text-emerald-700 shadow-sm hover:bg-emerald-50/80 hover:border-emerald-500 hover:text-emerald-800 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-emerald-500 backdrop-blur-xs",
  ghost:
    "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 focus-visible:outline-emerald-500",
};

const sizeClasses: Record<WhatsAppSize, string> = {
  sm: "h-9 gap-1.5 rounded-lg px-3.5 text-xs font-semibold",
  md: "h-11 gap-2 rounded-xl px-4 text-sm font-semibold",
  lg: "h-12 gap-2.5 rounded-xl px-5.5 text-base font-semibold",
};

interface WhatsAppLinkProps extends Omit<ComponentProps<"a">, "href"> {
  href: string;
  variant?: WhatsAppVariant;
  size?: WhatsAppSize;
  iconClassName?: string;
}

export function WhatsAppLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  iconClassName,
  ...props
}: WhatsAppLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <MessageCircle
        className={cn("size-4 shrink-0 transition-transform duration-300 group-hover:scale-110", iconClassName)}
        aria-hidden="true"
      />
      {children}
    </a>
  );
}
