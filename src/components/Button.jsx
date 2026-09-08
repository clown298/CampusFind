import { Link } from "react-router-dom";

function Button({
  children,
  variant = "secondary",
  className = "",
  type = "button",
  to,
  ...props
}) {
  const variants = {
    primary: "bg-brick text-white hover:bg-brick-hover",
    secondary:
      "border border-ink bg-surface text-ink hover:bg-paper",
    save: "bg-canopy text-white hover:bg-canopy-hover",
    ink: "bg-ink text-white hover:bg-ink-hover",
    danger:
      "border border-lost bg-surface text-lost hover:bg-paper",
    dangerSolid: "bg-lost text-white hover:bg-[#732626]",
  };

  const classes = [
    "inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] px-4 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    variants[variant] || variants.secondary,
    className,
  ].join(" ");

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;
