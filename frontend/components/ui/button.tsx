import { ButtonHTMLAttributes, forwardRef } from "react";
import classNames from "classnames";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white shadow-soft hover:bg-brand-600 focus:ring-brand-200",
  secondary:
    "bg-accent-500 text-white shadow-soft hover:bg-accent-600 focus:ring-accent-200",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-200",
  outline:
    "border border-neutral-200 text-neutral-800 hover:bg-neutral-50 focus:ring-neutral-200",
  danger:
    "bg-danger-500 text-white shadow-soft hover:bg-danger-600 focus:ring-danger-200",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = "primary", loading = false, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={classNames(baseClasses, variantClasses[variant], className, {
          "pointer-events-none": loading,
        })}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" aria-hidden />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
