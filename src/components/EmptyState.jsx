import Button from "./Button";
import { CampusIcon, FoundIcon, LostIcon } from "./icons";

const ICONS = {
  lost: LostIcon,
  found: FoundIcon,
  primary: CampusIcon,
};

const CHIP_TONES = {
  lost: "bg-lost/10 text-lost",
  found: "bg-found/10 text-found",
  primary: "bg-paper text-ink",
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
    <div className="rounded-card border border-line bg-surface px-5 py-12 text-center sm:px-8">
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
      <p className="mx-auto mt-2 max-w-lg text-[0.9375rem] leading-6 text-mute">
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