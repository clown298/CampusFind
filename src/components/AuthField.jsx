function AuthField({
  id,
  label,
  type = "text",
  name,
  value,
  onChange,
  autoComplete,
  placeholder,
  maxLength,
  required = false,
  error,
  helper,
}) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

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
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          error ? errorId : helper ? helperId : undefined
        }
        className={`w-full min-h-[44px] rounded-control border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
          error
            ? "border-lost bg-lost/5 focus-visible:ring-lost"
            : "border-line bg-surface hover:border-mute/40"
        }`}
      />
      {!error && helper ? (
        <p id={helperId} className="mt-1.5 text-xs text-mute">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-lost">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default AuthField;