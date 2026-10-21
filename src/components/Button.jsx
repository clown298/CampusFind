import { Link } from "react-router-dom";

function Button({
  children,
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  to,
  ...props
}) {
  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-hover shadow-sm shadow-primary/20",
    secondary:
      "border border-line bg-surface text-ink hover:border-mute/40 hover:bg-paper",
    ghost: "text-mute hover:text-ink hover:bg-paper",
    lost: "bg-lost text-white hover:bg-lost-dark shadow-sm shadow-lost/20",
    found: "bg-found text-white hover:bg-found-dark shadow-sm shadow-found/20",
    danger:
      "border border-lost/40 bg-surface text-lost hover:bg-lost-tint hover:border-lost/60",
    dangerSolid:
      "bg-lost text-white hover:bg-lost-dark shadow-sm shadow-lost/20",
  };

  const sizes = {
    md: "min-h-[44px] px-4 text-sm font-semibold",
    sm: "min-h-[38px] px-3.5 text-xs font-semibold",
    lg: "min-h-[48px] px-5 text-base font-semibold",
  };

  const classes = [
    "inline-flex cursor-pointer items-center justify-center rounded-control font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:translate-y-px active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    sizes[size] || sizes.md,
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
