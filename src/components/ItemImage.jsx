function ItemImage({
  type = "lost",
  imageData,
  alt = "",
  className = "",
  groupHover = false,
  compact = false,
}) {
  if (imageData) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-paper ${className}`}
      >
        <img
          src={imageData}
          alt={alt}
          loading="lazy"
          className={`h-full w-full object-cover object-center ${
            groupHover ? "img-hover-zoom" : ""
          }`}
        />
      </div>
    );
  }

  const label = alt || `This ${type === "found" ? "found" : "lost"} item`;

  return (
    <div
      role="img"
      aria-label={`${label} — no photo provided`}
      className={`relative flex flex-col items-center justify-center gap-1.5 bg-paper px-4 text-center text-mute ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={compact ? "20" : "28"}
        height={compact ? "20" : "28"}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-mute/50"
        aria-hidden="true"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
      <span className="text-xs font-medium tracking-wide text-mute/80">
        No photo provided
      </span>
    </div>
  );
}

export default ItemImage;
