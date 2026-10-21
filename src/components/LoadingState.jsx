function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg
      className={`${className} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function LoadingState({ label = "Loading…", className = "" }) {
  return (
    <div
      className={`rounded-card border border-line bg-surface px-5 py-12 text-center sm:px-8 shadow-sm shadow-black/5 ${className}`}
      role="status"
    >
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-paper text-primary"
        aria-hidden="true"
      >
        <Spinner className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-mute">{label}</p>
    </div>
  );
}

export { Spinner };
export default LoadingState;
