import { useDocumentTitle } from "../utils/seo";

const TONE_BADGE = {
  lost: "border-lost/30 bg-lost/10 text-lost",
  found: "border-found/30 bg-found/10 text-found",
  recovered: "border-recovered/30 bg-recovered/10 text-recovered",
  neutral: "border-line bg-surface text-mute",
  primary: "border-primary/30 bg-primary/10 text-primary",
  olive: "border-olive/30 bg-olive/10 text-olive",
};

function PageShell({
  title,
  description,
  meta,
  action,
  icon,
  tone,
  badgeText,
  eyebrow,
  children,
}) {
  useDocumentTitle(title);
  const displayBadge = badgeText || eyebrow;
  const hasHeader =
    title || description || meta || action || icon || displayBadge;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] overflow-x-clip px-4 py-8 sm:px-8 sm:py-10 lg:py-12">
      {hasHeader ? (
        <header className="mb-8 border-b border-line pb-8 sm:mb-10 sm:pb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              {displayBadge ? (
                <div
                  className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                    TONE_BADGE[tone] || TONE_BADGE.primary
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      tone === "lost"
                        ? "bg-lost"
                        : tone === "found"
                          ? "bg-found"
                          : "bg-primary"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{displayBadge}</span>
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3.5">
                {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
                {title ? (
                  <h1 className="type-title min-w-0 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                    {title}
                  </h1>
                ) : null}
              </div>

              {description ? (
                <p className="mt-3.5 text-base leading-relaxed text-mute">
                  {description}
                </p>
              ) : null}

              {meta ? (
                <div className="mt-3 text-sm font-medium text-ink">{meta}</div>
              ) : null}
            </div>

            {action ? (
              <div className="w-full shrink-0 sm:w-auto">{action}</div>
            ) : null}
          </div>
        </header>
      ) : null}

      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default PageShell;
