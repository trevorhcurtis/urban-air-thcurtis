import type { InputHTMLAttributes, ReactNode } from "react";

/** 20px radio for mutually exclusive choices. Group radios with a fieldset and legend. */
export function Radio({ children, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  return (
    <label className={`inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-primary ${className}`}>
      <input type="radio" className="h-5 w-5 shrink-0 accent-surface-interactive" {...props} />
      <span>{children}</span>
    </label>
  );
}
