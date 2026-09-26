function PageShell({
  title,
  description,
  meta,
  action,
  icon,
  tone,
  eyebrow,
  children,
}) {
  const hasHeader = title || description || meta || action || icon || eyebrow;

  const tones = {
    lost: "bg-lost",
    found: "bg-found",
    recovered: "bg-recovered",
    neutral: "bg-ink",
    primary: "bg-primary",
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] overflow-x-clip px-4 py-8 sm:px-8 sm:py-10">
      {hasHeader ? (
        <header className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute">
                  {tone ? (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        tones[tone] || "bg-primary"
                      }`}
                      aria-hidden="true"
                    />
                  ) : null}
                  {eyebrow}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                {icon ? <span className="shrink-0">{icon}</span> : null}
                {title ? (
                  <h1 className="type-title min-w-0 text-3xl text-ink md:text-4xl">
                    {title}
                  </h1>
                ) : null}
              </div>
              {description ? (
                <p className="mt-2.5 max-w-2xl text-[0.9375rem] leading-6 text-mute">
                  {description}
                </p>
              ) : null}
              {meta ? (
                <p className="mt-3 text-sm font-semibold text-ink">{meta}</p>
              ) : null}
            </div>
            {action ? (
              <div className="w-full shrink-0 sm:w-auto">{action}</div>
            ) : null}
          </div>
        </header>
      ) : null}
      {children}
    </div>
  );
}

export default PageShell;