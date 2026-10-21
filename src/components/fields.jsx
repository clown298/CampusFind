export function FieldLabel({ htmlFor, children, required = false }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-semibold text-ink"
    >
      {children}
      {required ? (
        <>
          <span className="ml-1 text-lost" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      ) : null}
    </label>
  );
}

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-lost">
      {children}
    </p>
  );
}

export function FieldHint({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-xs leading-5 text-mute">
      {children}
    </p>
  );
}
