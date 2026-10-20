import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Common = {
  id: string;
  label: string;
  error?: string;
  help?: string;
  required?: boolean;
};

/** Shared control look. Boundaries use border.default (3:1), and border.interactive on hover. Focus comes from the global focus-visible outline. */
const controlClass =
  "mt-1 block w-full min-h-control-lg rounded-md border bg-surface-canvas px-3 py-2.5 text-md text-text-primary placeholder:text-text-muted";

function boundary(error?: string) {
  return error ? "border-solid-error" : "border-border-default hover:border-border-interactive";
}

/** Label, control, help, and error. Help and error are linked to the control with aria-describedby. */
function Shell({ id, label, error, help, required, children }: Common & { children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-1 text-text-error" aria-hidden="true">*</span>}
      </label>
      {children}
      {help && !error && <p id={`${id}-help`} className="mt-1 text-sm text-text-muted">{help}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 flex items-start gap-1.5 text-sm font-medium text-text-error">
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

export function TextField({
  id, label, error, help, required, className = "", ...props
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Shell id={id} label={label} error={error} help={help} required={required}>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        className={`${controlClass} ${boundary(error)} ${className}`}
        {...props}
      />
    </Shell>
  );
}

/** Date entry. Uses the browser's date control, which is keyboard and screen-reader accessible. */
export function DateField(props: Omit<Common & InputHTMLAttributes<HTMLInputElement>, "type">) {
  return <TextField {...props} type="date" />;
}

export function SelectField({
  id, label, error, help, required, children, className = "", ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <Shell id={id} label={label} error={error} help={help} required={required}>
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        className={`${controlClass} ${boundary(error)} ${className}`}
        {...props}
      >
        {children}
      </select>
    </Shell>
  );
}

/** Multi-line entry. Minimum 96px (6rem) high, resizable. */
export function TextareaField({
  id, label, error, help, required, className = "", ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Shell id={id} label={label} error={error} help={help} required={required}>
      <textarea
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        className={`${controlClass} min-h-24 py-2.5 ${boundary(error)} ${className}`}
        {...props}
      />
    </Shell>
  );
}
