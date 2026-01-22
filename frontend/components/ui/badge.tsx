import { HTMLAttributes } from "react";
import classNames from "classnames";

export type BadgeVariant = "success" | "info" | "warning" | "danger" | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const baseClasses =
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide";

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-brand-50 text-brand-700 border border-brand-200",
  info: "bg-accent-50 text-accent-700 border border-accent-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-danger-50 text-danger-700 border border-danger-200",
  neutral: "bg-neutral-100 text-neutral-700 border border-neutral-200",
};

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span className={classNames(baseClasses, variantClasses[variant], className)} {...props}>
      {children}
    </span>
  );
}

export default Badge;
