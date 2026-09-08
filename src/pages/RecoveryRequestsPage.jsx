import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { RecoveryRequestContext } from "../context/RecoveryRequestContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";

const STATUS_META = {
  pending: {
    label: "Pending",
    classes: "border-line text-ink",
    note: "Awaiting review by the item owner.",
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
      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row">
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
  const { user, isAuthenticated, loading: authLoading } =
    useContext(AuthContext);
  const { recoveryRequests, isLoading, loadError, refreshRequests } =
    useContext(RecoveryRequestContext);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && loadError && refreshRequests) {
      refreshRequests().catch(() => {});
    }
  }, [isAuthenticated, loadError, refreshRequests]);

  const countLabel = recoveryRequests.length === 1 ? "request" : "requests";

  if (authLoading) {
    return (
      <PageShell
        title="Recovery Requests"
        description="Review claims made against your lost items."
      >
        <div
          className="rounded-[8px] border border-line bg-surface px-5 py-10 text-center sm:px-8"
          role="status"
        >
          <p className="text-sm font-semibold text-mute">
            Checking your session…
          </p>
        </div>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell
        title="Recovery Requests"
        description="Review claims made against your lost items."
      >
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-[6px] border border-line bg-surface p-5 text-center sm:p-8">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Sign in to review recovery requests
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-mute">
              Recovery requests contain private claimant details, so they are
              only visible to the owner of the lost item and the claimant who
              submitted them.
            </p>
            <div className="mt-6 flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row">
              <Button
                variant="ink"
                to="/login"
                state={{
                  from: {
                    pathname: location.pathname,
                    search: location.search,
                  },
                }}
                className="w-full sm:w-auto"
              >
                Login
              </Button>
              <Button
                variant="secondary"
                to="/register"
                state={{
                  from: {
                    pathname: location.pathname,
                    search: location.search,
                  },
                }}
                className="w-full sm:w-auto"
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Recovery Requests"
      description="Review requests submitted against your lost items. Approve a request when the claimant proves ownership, or reject it. Approved requests can be marked recovered after the item is returned."
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
          description="When another student submits a recovery request against one of your lost items, it will appear here for review."
        />
      ) : (
        <div className="space-y-5">
          {recoveryRequests.map((request) => {
            const meta = STATUS_META[request.status] || STATUS_META.pending;
            const isOwner = Boolean(
              user &&
                request.lostOwnerId &&
                String(request.lostOwnerId) === String(user.id)
            );
            const isClaimant = Boolean(
              user &&
                request.claimantUserId &&
                String(request.claimantUserId) === String(user.id)
            );
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
                  {request.claimantEmail ? (
                    <p className="mt-0.5 break-words text-sm text-mute">
                      {request.claimantEmail}
                    </p>
                  ) : null}
                  {request.claimantPhone ? (
                    <p className="mt-0.5 text-sm text-mute">
                      {request.claimantPhone}
                    </p>
                  ) : null}
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
                    {request.claimantMessage}
                  </p>
                  {request.proofImages && request.proofImages.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mute">
                        Proof images
                      </p>
                      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {request.proofImages.map((image, index) => (
                          <li
                            key={index}
                            className="overflow-hidden rounded-[4px] border border-line bg-surface"
                          >
                            <img
                              src={image}
                              alt={`Proof of ownership ${index + 1}`}
                              className="h-28 w-full object-cover bg-ink/5"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <p className="mt-4 text-sm leading-6 text-mute">{meta.note}</p>

                {isOwner ? (
                  <RequestActions request={request} />
                ) : isClaimant ? (
                  <p className="mt-4 text-sm leading-6 text-mute">
                    This is a request you submitted. Status updates are handled
                    by the lost item owner.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

export default RecoveryRequestsPage;