import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { RecoveryRequestContext } from "../context/RecoveryRequestContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";

const STATUS_META = {
  pending: {
    label: "Pending",
    classes: "border-line text-ink",
    note: "Awaiting review by the campus office.",
  },
  approved: {
    label: "Approved",
    classes: "border-canopy text-canopy",
    note: "Approved. The found item can now be returned.",
  },
  rejected: {
    label: "Rejected",
    classes: "border-lost text-lost",
    note: "This request was rejected.",
  },
  recovered: {
    label: "Recovered",
    classes: "border-canopy text-canopy",
    note: "The item was returned to the owner.",
  },
};

function ItemLink({ type, item }) {
  const isFound = type === "found";
  const path = isFound ? `/found-items/${item.id}` : `/lost-items/${item.id}`;
  const accent = isFound ? "text-canopy" : "text-brick";
  return (
    <div>
      <p
        className={`text-xs font-semibold uppercase tracking-[0.1em] ${accent}`}
      >
        {isFound ? "Found item" : "Lost item"}
      </p>
      <Link
        to={path}
        className={`mt-1 inline-block break-words font-serif text-lg font-semibold no-underline transition-colors duration-200 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-[4px] -m-1 p-1 ${accent}`}
      >
        {item.itemName}
      </Link>
      <p className="mt-1 break-words text-sm text-mute">
        {item.category} · {item.location}
      </p>
    </div>
  );
}

function RequestActions({ request }) {
  const { updateRecoveryRequestStatus } = useContext(RecoveryRequestContext);
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function changeStatus(status) {
    setBusy(status);
    setActionError(null);
    try {
      await updateRecoveryRequestStatus(request.id, status);
    } catch (error) {
      console.error("Error updating recovery request:", error);
      setActionError(
        (error && error.message) ||
          "Could not update the request. Please try again."
      );
    } finally {
      setBusy(null);
    }
  }

  if (request.status === "pending") {
    return (
      <div className="mt-5 flex flex-col-reverse items-stretch gap-3 sm:flex-row">
        <Button
          variant="save"
          disabled={busy !== null}
          onClick={() => changeStatus("approved")}
          className="w-full sm:w-auto"
        >
          {busy === "approved" ? "Approving…" : "Approve"}
        </Button>
        <Button
          variant="danger"
          disabled={busy !== null}
          onClick={() => changeStatus("rejected")}
          className="w-full sm:w-auto"
        >
          {busy === "rejected" ? "Rejecting…" : "Reject"}
        </Button>
        {actionError ? (
          <p className="w-full text-sm font-medium text-lost" role="alert">
            {actionError}
          </p>
        ) : null}
      </div>
    );
  }

  if (request.status === "approved") {
    return (
      <div className="mt-5 flex flex-col-reverse items-stretch gap-3 sm:flex-row">
        <Button
          variant="save"
          disabled={busy !== null}
          onClick={() => changeStatus("recovered")}
          className="w-full sm:w-auto"
        >
          {busy === "recovered" ? "Marking…" : "Mark as Recovered"}
        </Button>
        {actionError ? (
          <p className="w-full text-sm font-medium text-lost" role="alert">
            {actionError}
          </p>
        ) : null}
      </div>
    );
  }

  return null;
}

function RecoveryRequestsPage() {
  const { recoveryRequests, isLoading, loadError } = useContext(
    RecoveryRequestContext
  );

  const countLabel = recoveryRequests.length === 1 ? "request" : "requests";

  return (
    <PageShell
      title="Recovery Requests"
      description="Review claims made against possible matches. Approve a request when the claimant proves ownership, or reject it. Approved requests can be marked as recovered after the item is returned."
      meta={`${recoveryRequests.length} ${countLabel}`}
    >
      {loadError && (
        <div
          className="mb-4 rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
          role="alert"
        >
          <p className="font-semibold">Recovery requests unavailable</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      {isLoading ? (
        <div
          className="rounded-[8px] border border-line bg-surface px-5 py-10 text-center sm:px-8"
          role="status"
        >
          <p className="text-sm font-semibold text-mute">
            Loading recovery requests…
          </p>
        </div>
      ) : recoveryRequests.length === 0 ? (
        <EmptyState
          title="No recovery requests yet"
          description="When a student submits a recovery request from a possible match on an item page, it will appear here for review."
        />
      ) : (
        <div className="space-y-5">
          {recoveryRequests.map((request) => {
            const meta = STATUS_META[request.status] || STATUS_META.pending;
            return (
              <article
                key={request.id}
                className="rounded-[8px] border border-line bg-surface p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] ${meta.classes}`}
                  >
                    {meta.label}
                  </span>
                  <p className="text-sm text-mute">
                    Submitted {request.createdAt}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <ItemLink type="lost" item={request.lostItem} />
                  <ItemLink type="found" item={request.foundItem} />
                </div>

                <div className="mt-5 rounded-[6px] border border-line bg-paper p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mute">
                    Claimant
                  </p>
                  <p className="mt-1.5 text-base font-medium text-ink">
                    {request.claimantName}
                  </p>
                  <p className="mt-0.5 text-sm text-mute">
                    {request.claimantContact}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
                    {request.claimantMessage}
                  </p>
                </div>

                <p className="mt-4 text-sm leading-6 text-mute">{meta.note}</p>

                <RequestActions request={request} />
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

export default RecoveryRequestsPage;