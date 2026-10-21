function BrandMark({ size = 26, tone = "brand", className = "" }) {
  const stroke = tone === "inverse" ? "#FFFFFF" : "#B85437";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2.5" y="2.5" width="27" height="27" rx="7" strokeWidth="2.25" />
        <circle cx="14" cy="14" r="4.5" strokeWidth="2.25" />
        <path d="m17.5 17.5 4 4" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

export default BrandMark;
