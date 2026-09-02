import Button from "./Button";

function EmptyState({ title, description, actionLabel, actionTo, variant = "primary" }) {
  return (
    <div className="rounded-[8px] border border-line bg-surface px-5 py-10 text-center sm:px-8">
      <h2 className="font-serif text-2xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-6 text-mute">
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
