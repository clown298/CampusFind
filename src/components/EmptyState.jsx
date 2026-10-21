import Button from "./Button";
import { CampusIcon, FoundIcon, LostIcon } from "./icons";

const ICONS = {
  lost: LostIcon,
  found: FoundIcon,
  primary: CampusIcon,
};

const CHIP_TONES = {
  lost: "bg-lost/15 text-lost border border-lost/30",
  found: "bg-found/15 text-found border border-found/30",
  primary: "bg-frost text-primary border border-line",
};

function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  variant = "primary",
}) {
  const Icon = ICONS[variant] || CampusIcon;

  return (
    <div className="hero-rise rounded-card border border-line bg-surface px-5 py-14 text-center sm:px-8">
      <span
        className={`inline-flex h-12 w-12 items-center justify-center rounded-control ${
          CHIP_TONES[variant] || CHIP_TONES.primary
        }`}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <h2 className="type-section mt-5 text-xl text-ink sm:text-2xl">
        {title}
      </h2>
      <p className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed text-mute">
        {description}
      </p>
      {actionLabel && actionTo ? (
        <div className="mt-6">
          <Button
            to={actionTo}
            variant={variant}
            className="w-full sm:w-auto"
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default EmptyState;
