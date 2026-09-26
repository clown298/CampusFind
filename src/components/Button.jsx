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
    primary: "bg-ink text-white hover:bg-ink-hover",
    secondary:
      "border border-line bg-surface text-ink hover:border-mute/40 hover:bg-paper",
    ghost: "text-mute hover:text-ink",
    lost: "bg-lost text-white hover:bg-lost-dark",
    found: "bg-found text-white hover:bg-found-dark",
    danger: "border border-lost/40 bg-surface text-lost hover:bg-lost-tint",
    dangerSolid: "bg-lost text-white hover:bg-lost-dark",
  };

  const classes = [
    "inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-control px-4 text-[15px] font-semibold transition-[background-color,border-color,color,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
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