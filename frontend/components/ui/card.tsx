import { HTMLAttributes } from "react";
import classNames from "classnames";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, elevated = false, children, ...props }: CardProps) {
  return (
    <div
      className={classNames(
        "rounded-2xl border border-neutral-200 bg-white",
        { "shadow-card": elevated, "shadow-soft": !elevated },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
