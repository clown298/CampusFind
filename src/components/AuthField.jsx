import { useState } from "react";

function AuthField({
  id,
  label,
  type = "text",
  name,
  value,
  onChange,
  onFocus,
  onBlur,
  autoComplete,
  placeholder,
  maxLength,
  inputMode,
  pattern,
  required = false,
  error,
  helper,
}) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-ink"
      >
        {label}
        {required ? (
          <>
            <span className="ml-1 text-lost" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        ) : null}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          pattern={pattern}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? errorId : helper ? helperId : undefined
          }
          className={`w-full min-h-[44px] rounded-control border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
            isPassword ? "pr-11" : ""
          } ${
            error
              ? "border-lost bg-lost/5 focus-visible:ring-lost"
              : "border-line bg-surface hover:border-mute/40"
          }`}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            aria-pressed={revealed}
            aria-controls={id}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-control text-mute transition-colors duration-150 hover:bg-frost hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {revealed ? (
              <span key="hide" className="icon-pop">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <path d="m1 1 22 22" />
                </svg>
              </span>
            ) : (
              <span key="show" className="icon-pop">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
            )}
          </button>
        ) : null}
      </div>
      {!error && helper ? (
        <p id={helperId} className="mt-1.5 text-xs text-mute">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="animate-alert-in mt-1.5 text-sm font-medium text-lost">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default AuthField;
