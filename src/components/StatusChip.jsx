function StatusChip({ label, classes = "", dot }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold normal-case ${classes}`}
    >
      {dot ? (
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      ) : null}
      {label}
    </span>
  );
}

export default StatusChip;