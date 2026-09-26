import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { RecoveryRequestContext } from "../context/RecoveryRequestContext";
import { LostItemContext } from "../context/LostItemContext";
import { FoundItemContext } from "../context/FoundItemContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";
import ItemImage from "../components/ItemImage";
import Reveal from "../components/Reveal";
import TypeChip from "../components/TypeChip";
import StatusChip from "../components/StatusChip";
import { CalendarIcon, FoundIcon, LostIcon, PinIcon, ReportIcon } from "../components/icons";
import { formatDisplayDate, getItemDate, getItemName } from "../utils/items";

const STATE_META = {
  Open: {
    chip: "border-line bg-paper text-mute",
    dot: "bg-mute",
  },
  "In Recovery": {
    chip: "border-pending/25 bg-pending/5 text-pending",
    dot: "bg-pending",
  },
  Recovered: {
    chip: "border-recovered/25 bg-recovered/5 text-recovered",
    dot: "bg-recovered",
  },
  Returned: {
    chip: "border-canopy/25 bg-canopy/5 text-canopy",
    dot: "bg-canopy",
  },
};

function MyReportItem({ kind, item, onDelete, onOpen }) {
  const isFound = kind === "found";
  const statusLabel = isFound ? "Found" : "Lost";
  const detailsPath = isFound
    ? `/found-items/${item.id}`
    : `/lost-items/${item.id}`;
  const stateMeta = STATE_META[onOpen] || STATE_META.Open;

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
    <article
      className={`group min-w-0 rounded-card border border-line bg-surface transition-colors duration-200 ${
        isFound ? "hover:border-found/40" : "hover:border-lost/40"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <ItemImage
            type={kind}
            imageData={item.imageData}
            alt={`Photo of ${displayName}`}
            className="h-32 w-full shrink-0 rounded-control border border-line sm:h-24 sm:w-28"
            groupHover
            compact
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <TypeChip
                tone={isFound ? "found" : "lost"}
                icon={isFound ? FoundIcon : LostIcon}
                label={statusLabel}
              />
              <StatusChip
                label={onOpen}
                classes={stateMeta.chip}
                dot={stateMeta.dot}
              />
            </div>

            <h3 className="type-card mt-2 break-words text-xl text-ink">
              <Link
                to={detailsPath}
                className="-m-1 rounded-control p-1 underline-offset-4 no-underline transition-colors duration-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label={`View details: ${displayName}`}
              >
                {displayName}
              </Link>
            </h3>

            {item.category ? (
              <p className="mt-1 break-words text-sm font-medium text-mute">
                {item.category}
              </p>
            ) : null}

            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mute">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <PinIcon
                  size={14}
                  className="shrink-0 text-mute"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{item.location}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon
                  size={14}
                  className="shrink-0 text-mute"
                  aria-hidden="true"
                />
                {statusLabel} on {displayDate}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Button to={detailsPath} variant="secondary" className="w-full sm:w-auto">
            View details
          </Button>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        </div>
      </div>

      {confirming ? (
        <div
          className="border-t border-line bg-paper/50 px-5 py-4"
          role="group"
          aria-label="Confirm delete"
        >
          <p className="text-sm font-semibold text-ink">
            Delete this {statusLabel.toLowerCase()} report?
          </p>
          <p className="mt-1 text-sm text-mute">
            &ldquo;{displayName || "This item"}&rdquo; will be removed from your
            reports. This cannot be undone.
          </p>
          {deleteError && (
            <p
              className="mt-3 rounded-control border border-lost/30 bg-lost/10 p-3 text-sm font-medium text-lost"
              role="alert"
            >
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
      ) : null}
    </article>
  );
}

function MyReportsPage() {
  const { recoveryRequests } = useContext(RecoveryRequestContext);
  const { deleteLostItem } = useContext(LostItemContext);
  const { deleteFoundItem } = useContext(FoundItemContext);

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
    if (kind === "lost") {
      await deleteLostItem(id);
    } else {
      await deleteFoundItem(id);
    }
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

  const eyebrow = "GCOEC • Campus Lost & Found";

  if (isLoading) {
    return (
      <PageShell
        title="My Reports"
        description="Track the lost and found items you have reported."
        eyebrow={eyebrow}
      >
        <div
          className="rounded-card border border-line bg-surface px-5 py-10 text-center sm:px-8"
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
        description="Track the lost and found items you have reported."
        eyebrow={eyebrow}
      >
        <div
          className="rounded-card border border-lost/30 bg-lost/10 p-4 text-sm text-lost sm:p-5"
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

  const allStatuses = [
    ...lostItems.map((item) => itemOpenStatus("lost", item)),
    ...foundItems.map((item) => itemOpenStatus("found", item)),
  ];
  const totalCount = allStatuses.length;
  const openCount = allStatuses.filter((s) => s === "Open").length;
  const recoveryCount = allStatuses.filter((s) => s === "In Recovery").length;
  const resolvedCount = allStatuses.filter(
    (s) => s === "Recovered" || s === "Returned"
  ).length;

  return (
    <PageShell
      title="My Reports"
      description="Track the lost and found items you have reported."
      eyebrow={eyebrow}
      icon={<TypeChip tone="neutral" icon={ReportIcon} label="Your reports" />}
      tone="neutral"
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            to="/report-lost"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Report Lost
          </Button>
          <Button
            to="/report-found"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Report Found
          </Button>
        </div>
      }
    >
      {!hasItems ? (
        <div className="mx-auto max-w-xl rounded-card border border-line bg-surface px-5 py-12 text-center sm:px-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-control bg-paper text-ink">
            <ReportIcon size={24} />
          </span>
          <h2 className="type-section mt-5 text-xl text-ink sm:text-2xl">
            No reports yet
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-base leading-6 text-mute">
            You haven&rsquo;t reported a lost or found item yet. Report one so
            the campus community can help.
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            <Button
              to="/report-lost"
              variant="lost"
              className="w-full sm:w-auto"
            >
              Report Lost Item
            </Button>
            <Button
              to="/report-found"
              variant="found"
              className="w-full sm:w-auto"
            >
              Report Found Item
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-card border border-line bg-surface p-4">
              <p className="type-title text-3xl leading-none text-ink">
                {totalCount}
              </p>
              <p className="mt-2 text-sm text-mute">Total reports</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-4">
              <p className="type-title text-3xl leading-none text-ink">
                {openCount}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-mute">
                <span className="h-1.5 w-1.5 rounded-full bg-mute" aria-hidden="true" />
                Open
              </p>
            </div>
            <div className="rounded-card border border-line bg-surface p-4">
              <p className="type-title text-3xl leading-none text-ink">
                {recoveryCount}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-mute">
                <span className="h-1.5 w-1.5 rounded-full bg-pending" aria-hidden="true" />
                In recovery
              </p>
            </div>
            <div className="rounded-card border border-line bg-surface p-4">
              <p className="type-title text-3xl leading-none text-ink">
                {resolvedCount}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-mute">
                <span className="h-1.5 w-1.5 rounded-full bg-canopy" aria-hidden="true" />
                Resolved
              </p>
            </div>
          </div>

          {lostItems.length > 0 ? (
            <section>
              <h2 className="type-section flex items-center gap-2 text-2xl text-ink">
                <LostIcon size={20} className="text-lost" />
                Lost Reports
              </h2>
              <p className="mt-2 text-sm leading-6 text-mute">
                {lostItems.length} report{lostItems.length === 1 ? "" : "s"} you
                have filed as lost.
              </p>
              <Reveal className="min-w-0">
                <ul className="mt-5 space-y-3">
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
              </Reveal>
            </section>
          ) : null}

          {foundItems.length > 0 ? (
            <section>
              <h2 className="type-section flex items-center gap-2 text-2xl text-ink">
                <FoundIcon size={20} className="text-found" />
                Found Reports
              </h2>
              <p className="mt-2 text-sm leading-6 text-mute">
                {foundItems.length} report{foundItems.length === 1 ? "" : "s"} you
                have filed as found.
              </p>
              <Reveal className="min-w-0">
                <ul className="mt-5 space-y-3">
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
              </Reveal>
            </section>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}

export default MyReportsPage;