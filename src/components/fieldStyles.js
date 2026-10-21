export const inputClass = (hasError) =>
  [
    "w-full min-h-[44px] rounded-control border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/60 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    hasError
      ? "border-lost bg-lost-tint/70 focus-visible:ring-lost"
      : "border-line bg-surface hover:border-line/90",
  ].join(" ");

export const textareaClass = (hasError) =>
  [
    "w-full rounded-control border px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-mute/60 resize-y transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    hasError
      ? "border-lost bg-lost-tint/70 focus-visible:ring-lost"
      : "border-line bg-surface hover:border-line/90",
  ].join(" ");

export const selectClass = (hasError) =>
  `${inputClass(hasError)} cursor-pointer`;
