function BrandMark({ size = 26, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <circle
        cx="14.5"
        cy="14.5"
        r="6"
        stroke="white"
        strokeWidth="2.4"
      />
      <path
        d="M19 19l4.5 4.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M11.8 9.4 13 7.6M8.6 11.6 6.8 10.4"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle
        cx="14.5"
        cy="14.5"
        r="2"
        stroke="white"
        strokeWidth="2.6"
      />
    </svg>
  );
}

export default BrandMark;