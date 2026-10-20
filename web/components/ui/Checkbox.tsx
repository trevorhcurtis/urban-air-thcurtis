import { useId, type InputHTMLAttributes, type ReactNode } from "react";

/**
 * 20px checkbox with its label. The whole label is the click and tap target.
 * An error uses the same look as the Input: a solid error outline on the control, and a message with an icon.
 */
export function Checkbox({
  children,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode; error?: string }) {
  const errorId = useId();
  const invalid = Boolean(error ?? props["aria-invalid"]);

  return (
    <div className={`flex flex-col ${className}`}>
      <label className="inline-flex min-h-11 cursor-pointer items-start gap-3 text-sm text-text-primary">
        <input
          type="checkbox"
          {...props}
          aria-invalid={invalid || undefined}
          aria-describedby={error ? errorId : props["aria-describedby"]}
          className={`mt-0.5 h-5 w-5 shrink-0 accent-surface-interactive ${invalid ? "accent-solid-error outline outline-2 outline-offset-2 outline-solid-error" : ""}`}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={errorId} className="ml-8 mt-1 flex items-start gap-1.5 text-sm font-medium text-text-error">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4.5M8 11.25v.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
