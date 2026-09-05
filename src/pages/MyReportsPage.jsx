import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { RecoveryRequestContext } from "../context/RecoveryRequestContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { formatDisplayDate, getItemDate, getItemName } from "../utils/items";

function MyReportItem({ kind, item, onDelete, onOpen }) {
  const isFound = kind === "found";
  const badgeClass = isFound
    ? "border-canopy text-canopy"
    : "border-brick text-brick";
  const accentClass = isFound ? "text-canopy" : "text-brick";
  const statusLabel = isFound ? "Found" : "Lost";
  const detailsPath = isFound
    ? `/found-items/${item.id}`
    : `/lost-items/${item.id}`;

  const displayName = getItemName(item);
  const displayDate = formatDisplayDate(getItemDate(item, kind));

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(kind, item.id);
    } catch (err) {
      console.error("Error deleting item:", err);
      setDeleteError(
        (err && err.message) || "Could not delete the item. Please try again."
      );
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <article className="min-w-0 rounded-[8px] border border-line bg-surface p-5">
      {item.imageData && (
        <div className="mb-4 -mx-5 -mt-5 overflow-hidden rounded-t-[8px] border-b border-line bg-ink/5 aspect-[4/3]">
          <img src={item.imageData} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex rounded-[4px] border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] ${badgeClass}`}
        >
          {statusLabel}
        </span>
        <span
          className={`inline-flex rounded-[4px] border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] ${
            onOpen === "Open" ? "border-line text-mute" : "border-canopy text-canopy"
          }`}
        >
          {onOpen}
        </span>
      </div>

      <Link
        to={detailsPath}
        className={`mt-3 block break-words font-serif text-2xl font-semibold no-underline transition-colors duration-200 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-[4px] -m-1 p-1 ${accentClass}`}
        aria-label={`View details: ${displayName}`}
      >
        {displayName}
      </Link>

      <dl className="mt-4 space-y-2 break-words text-sm text-ink">
        <div>
          <dt className="inline font-semibold">Category: </dt>
          <dd className="inline">{item.category}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">
            {isFound ? "Location found: " : "Location: "}
          </dt>
          <dd className="inline">{item.location}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">
            {isFound ? "Date found: " : "Date lost: "}
          </dt>
          <dd className="inline">{displayDate}</dd>
        </div>
      </dl>

      {confirming ? (
        <div
          className="mt-5 rounded-[6px] border border-line bg-paper p-4"
          role="group"
          aria-label="Confirm delete"
        >
          <p className="text-sm font-semibold text-ink">
            Delete this {statusLabel.toLowerCase()} report?
          </p>
          <p className="mt-1 text-sm text-mute">
            "{displayName || "This item"}" will be removed from your reports.
            This cannot be undone.
          </p>
          {deleteError && (
            <p className="mt-3 rounded-[4px] border border-lost/30 bg-lost/10 p-3 text-sm font-medium text-lost">
              {deleteError}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="dangerSolid"
              onClick={handleDelete}
              disabled={deleting}
              aria-disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" to={detailsPath}>
            View / Edit
          </Button>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        </div>
      )}
    </article>
  );
}

function MyReportsPage() {
  const { recoveryRequests } = useContext(RecoveryRequestContext);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  async function load() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await apiRequest("/api/my-reports");
      setData(result);
    } catch (err) {
      console.error("Error loading my reports:", err);
      setLoadError(
        (err && err.message) ||
          "Could not load your reports. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await apiRequest("/api/my-reports");
        if (!cancelled) setData(result);
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading my reports:", err);
        setLoadError(
          (err && err.message) ||
            "Could not load your reports. Please try again later."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(kind, id) {
    await apiRequest(`/api/${kind}-items/${id}`, { method: "DELETE" });
    setData((prev) => ({
      ...prev,
      [`${kind}Items`]: (prev[`${kind}Items`] || []).filter(
        (i) => String(i.id) !== String(id)
      ),
    }));
  }

  function itemOpenStatus(kind, item) {
    const requests = recoveryRequests || [];
    const matched = requests.find((r) =>
      kind === "lost"
        ? String(r.lostItemId) === String(item.id)
        : String(r.foundItemId) === String(item.id)
    );
    if (matched && matched.status === "recovered") {
      return kind === "lost" ? "Recovered" : "Returned";
    }
    if (matched) return "In Recovery";
    return "Open";
  }

  if (isLoading) {
    return (
      <PageShell
        title="My Reports"
        description="Everything you have reported to CampusFind."
      >
        <div
          className="rounded-[8px] border border-line bg-surface px-5 py-10 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-mute">
            Loading your reports…
          </p>
        </div>
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell
        title="My Reports"
        description="Everything you have reported to CampusFind."
      >
        <div
          className="rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
          role="alert"
        >
          <p className="font-semibold">Could not load your reports</p>
          <p className="mt-1">{loadError}</p>
        </div>
        <div className="mt-6">
          <Button variant="secondary" onClick={load}>
            Try again
          </Button>
        </div>
      </PageShell>
    );
  }

  const lostItems = (data && data.lostItems) || [];
  const foundItems = (data && data.foundItems) || [];
  const hasItems = lostItems.length > 0 || foundItems.length > 0;

  return (
    <PageShell
      title="My Reports"
      description="Everything you have reported to CampusFind. You can view, edit, or delete your reports here."
    >
      {!hasItems ? (
        <EmptyState
          title="No reports yet"
          description="When you report a lost or found item, it will appear here so you can manage it."
          actionLabel="Report a Lost Item"
          actionTo="/report-lost"
        />
      ) : (
        <div className="space-y-12">
          {lostItems.length > 0 ? (
            <section>
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Lost Reports
              </h2>
              <p className="mt-2 text-sm leading-6 text-mute">
                {lostItems.length} report{lostItems.length === 1 ? "" : "s"} you
                have filed as lost.
              </p>
              <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lostItems.map((item) => (
                  <li key={item.id} className="min-w-0">
                    <MyReportItem
                      kind="lost"
                      item={item}
                      onDelete={handleDelete}
                      onOpen={itemOpenStatus("lost", item)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {foundItems.length > 0 ? (
            <section>
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Found Reports
              </h2>
              <p className="mt-2 text-sm leading-6 text-mute">
                {foundItems.length} report{foundItems.length === 1 ? "" : "s"} you
                have filed as found.
              </p>
              <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {foundItems.map((item) => (
                  <li key={item.id} className="min-w-0">
                    <MyReportItem
                      kind="found"
                      item={item}
                      onDelete={handleDelete}
                      onOpen={itemOpenStatus("found", item)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}

export default MyReportsPage;