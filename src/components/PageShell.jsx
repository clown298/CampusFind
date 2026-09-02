function PageShell({ title, description, meta, action, children }) {
  const hasHeader = title || description || meta || action;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-clip px-4 py-10 sm:px-6">
      {hasHeader ? (
        <header className="mb-8 border-b border-line pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              {title ? (
                <h1 className="font-serif text-3xl font-semibold text-ink md:text-4xl">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p className="mt-2 max-w-2xl text-base leading-6 text-mute">
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
