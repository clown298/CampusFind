import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { RecoveryRequestContext } from "../context/RecoveryRequestContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Reveal from "../components/Reveal";
import StatusChip from "../components/StatusChip";
import TypeChip from "../components/TypeChip";
import {
  ReportIcon,
  VerifyIcon,
  RecoverIcon,
  UserIcon,
  ShieldIcon,
  ArrowRightIcon,
} from "../components/icons";

const STATUS_ORDER = ["pending", "approved", "rejected", "recovered"];

const STATUS_META = {
  pending: {
    label: "Pending",
    chip: "border-pending text-pending",
    tint: "border-pending/25 bg-pending/5",
    accent: "border-l-pending",
    dot: "bg-pending",
    note: "Awaiting review by the item owner.",
    next: "Review the claimant's details, then approve the request if the item is theirs, or reject it.",
    progessIndex: 1,
  },
  approved: {
    label: "Approved",
    chip: "border-canopy text-canopy",
    tint: "border-canopy/25 bg-canopy/5",
    accent: "border-l-canopy",
    dot: "bg-canopy",
    note: "The found item can now be returned.",
    next: "Arrange the return with the claimant, then mark this request as recovered.",
    progessIndex: 2,
  },
  rejected: {
    label: "Rejected",
    chip: "border-lost text-lost",
    tint: "border-lost/25 bg-lost/5",
    accent: "border-l-lost",
    dot: "bg-lost",
    note: "This request was rejected.",
    next: "No action needed. The claimant has been informed the request was declined.",
    progessIndex: 2,
  },
  recovered: {
    label: "Recovered",
    chip: "border-recovered text-recovered",
    tint: "border-recovered/25 bg-recovered/5",
    accent: "border-l-recovered",
    dot: "bg-recovered",
    note: "The item was returned to the owner.",
    next: "This request is closed. The item has been returned.",
    progessIndex: 3,
  },
};

const PROGRESS_STEPS = [
  { key: "submitted", label: "Submitted", icon: ReportIcon },
  { key: "approved", label: "Approved", icon: VerifyIcon },
  { key: "recovered", label: "Recovered", icon: RecoverIcon },
];

function ItemLink({ type, item }) {
  const isFound = type === "found";
  const path = isFound ? `/found-items/${item.id}` : `/lost-items/${item.id}`;
  return (
    <div>
      <p className="text-xs font-semibold text-mute">
        {isFound ? "Found item" : "Lost item"}
      </p>
      <Link
        to={path}
        className="type-card mt-1 inline-block break-words text-lg text-ink no-underline transition-colors duration-200 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-card -m-1 p-1"
      >
        {item.itemName}
      </Link>
      <p className="mt-1 break-words text-sm text-mute">
        {item.category} · {item.location}
      </p>
    </div>
  );
}

function RequestProgress({ status }) {
  const rejected = status === "rejected";
  const progressIndex = STATUS_META[status]?.progessIndex || 1;

  function stateFor(stepIndex) {
    if (rejected && stepIndex === 1) {
      return "rejected";
    }
    if (status === "rejected" && stepIndex === 2) {
      return "upcoming";
    }
    if (stepIndex < progressIndex) {
      return "done";
    }
    if (stepIndex === progressIndex) {
      return "current";
    }
    return "upcoming";
  }

  const stateClasses = {
    done: "border-canopy bg-canopy text-white",
    current: "border-pending bg-pending/10 text-pending",
    rejected: "border-lost bg-lost text-white",
    upcoming: "border-line bg-surface text-mute",
  };

  return (
    <div className="relative">
      <span
        className="absolute left-[16.666%] right-[16.666%] top-4 hidden h-px bg-line sm:block"
        aria-hidden="true"
      />
      <ol className="grid grid-cols-3 gap-2 sm:gap-3">
        {PROGRESS_STEPS.map((step, index) => {
          const state = stateFor(index);
          const StepIcon = step.icon;
          return (
            <li key={step.key} className="flex flex-col items-center gap-2">
              <span
                className={`z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-200 ${stateClasses[state]}`}
                aria-hidden="true"
              >
                <StepIcon size={15} />
              </span>
              <span
                className={`text-xs font-semibold ${
                  state === "upcoming" ? "text-mute" : "text-ink"
                }`}
              >
                {state === "rejected" && step.key === "approved"
                  ? "Rejected"
                  : step.label}
              </span>
            </li>
          );
        })}
      </ol>
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
      <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row">
        <Button
          variant="found"
          disabled={busy !== null}
          onClick={() => changeStatus("approved")}
          className="w-full sm:w-auto"
        >
          {busy === "approved" ? "Approving…" : "Approve request"}
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
      <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row">
        <Button
          variant="found"
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

  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (isAuthenticated && loadError && refreshRequests) {
      refreshRequests().catch(() => {});
    }
  }, [isAuthenticated, loadError, refreshRequests]);

  const counts = useMemo(() => {
    const next = { all: recoveryRequests.length };
    for (const status of STATUS_ORDER) {
      next[status] = recoveryRequests.filter(
        (r) => r.status === status
      ).length;
    }
    return next;
  }, [recoveryRequests]);

  const visibleRequests = useMemo(() => {
    if (statusFilter === "all") return recoveryRequests;
    return recoveryRequests.filter((r) => r.status === statusFilter);
  }, [recoveryRequests, statusFilter]);

  const countLabel = recoveryRequests.length === 1 ? "request" : "requests";

  const FILTER_STYLES = {
    all: {
      active: "border-ink/25 bg-ink/5 text-ink",
      inactive: "border-line bg-surface text-ink hover:bg-paper",
    },
    pending: {
      active: "border-pending/30 bg-pending/10 text-pending",
      inactive: "border-line bg-surface text-mute hover:bg-pending/5 hover:text-pending",
    },
    approved: {
      active: "border-canopy/30 bg-canopy/10 text-canopy",
      inactive: "border-line bg-surface text-mute hover:bg-canopy/5 hover:text-canopy",
    },
    rejected: {
      active: "border-lost/30 bg-lost/10 text-lost",
      inactive: "border-line bg-surface text-mute hover:bg-lost/5 hover:text-lost",
    },
    recovered: {
      active: "border-recovered/30 bg-recovered/10 text-recovered",
      inactive: "border-line bg-surface text-mute hover:bg-recovered/5 hover:text-recovered",
    },
  };

  if (authLoading) {
    return (
      <PageShell
        title="Recovery Requests"
        description="Review requests related to items you can recover or return."
        eyebrow="GCOEC • Campus Lost & Found"
      >
        <div
          className="rounded-card border border-line bg-surface px-5 py-10 text-center sm:px-8"
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
        description="Review requests related to items you can recover or return."
        eyebrow="GCOEC • Campus Lost & Found"
      >
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-card border border-line bg-surface p-5 text-center sm:p-8">
            <h2 className="type-section text-2xl text-ink">
              Sign in to review recovery requests
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-mute">
              Recovery requests contain private claimant details, so they are
              only visible to the owner of the lost item and the claimant who
              submitted them.
            </p>
            <div className="mt-6 flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row">
              <Button
                variant="primary"
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
                  from: { pathname: location.pathname, search: location.search },
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
      description="Review requests related to items you may be able to recover or return. Approve a request when the claimant proves ownership, reject it, or mark an approved request recovered after the item is returned."
      eyebrow="GCOEC • Campus Lost & Found"
      icon={
        <TypeChip
          tone="recovered"
          icon={ShieldIcon}
          label="Recovery workflow"
        />
      }
      tone="recovered"
      meta={`${recoveryRequests.length} ${countLabel}`}
    >
      {loadError && (
        <div
          className="mb-4 rounded-card border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
          role="alert"
        >
          <p className="font-semibold">Recovery requests unavailable</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      {isLoading ? (
        <div
          className="rounded-card border border-line bg-surface px-5 py-10 text-center sm:px-8"
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
        <div>
          <div
            role="group"
            aria-label="Filter by status"
            className="mb-6 flex flex-wrap gap-2"
          >
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
              { key: "recovered", label: "Recovered" },
            ].map((filter) => {
              const isActive = statusFilter === filter.key;
              const style = FILTER_STYLES[filter.key];
              return (
                <button
                  key={filter.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-control border px-3.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                    isActive ? style.active : style.inactive
                  }`}
                >
                  {filter.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      isActive
                        ? "bg-ink/10 text-ink"
                        : "bg-paper text-mute"
                    }`}
                  >
                    {counts[filter.key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-5">
            {visibleRequests.map((request) => {
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
                <Reveal
                  as="article"
                  key={request.id}
                  className={`rounded-card border border-line border-l-4 bg-surface p-5 sm:p-6 transition-colors duration-200 ${meta.accent}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusChip
                      label={meta.label}
                      classes={meta.chip}
                      dot={meta.dot}
                    />
                    <p className="text-sm text-mute">
                      Submitted {request.createdAt}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    <ItemLink type="lost" item={request.lostItem} />
                    <div className="hidden sm:block" aria-hidden="true">
                      <p className="text-xs font-semibold text-mute">Direction</p>
                      <p className="mt-2 flex items-center gap-1.5">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper text-mute">
                          <ArrowRightIcon size={16} />
                        </span>
                        <span className="text-sm text-mute">
                          lost → found
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <ItemLink type="found" item={request.foundItem} />
                    </div>
                  </div>

                  <div className="mt-5">
                    <RequestProgress status={request.status} />
                  </div>

                  <div className={`mt-5 rounded-card border p-4 ${meta.tint}`}>
                    <p
                      className={`flex items-center gap-1.5 text-xs font-semibold ${
                        request.status === "rejected"
                          ? "text-lost"
                          : request.status === "recovered"
                          ? "text-recovered"
                          : request.status === "approved"
                          ? "text-canopy"
                          : "text-pending"
                      }`}
                    >
                      {request.status === "rejected" ? (
                        <ShieldIcon size={14} />
                      ) : (
                        <UserIcon size={14} />
                      )}
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
                        <p className="text-xs font-semibold text-mute">
                          Proof images
                        </p>
                        <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {request.proofImages.map((image, index) => (
                            <li
                              key={index}
                              className="overflow-hidden rounded-card border border-line bg-surface"
                            >
                              <img
                                src={image}
                                alt={`Proof of ownership ${index + 1}`}
                                className="h-28 w-full object-contain bg-paper"
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>

                  <div
                    className={`mt-4 rounded-card border p-4 ${
                      request.status === "pending"
                        ? "border-pending/20 bg-pending/5"
                        : request.status === "approved"
                        ? "border-canopy/20 bg-canopy/5"
                        : request.status === "recovered"
                        ? "border-recovered/20 bg-recovered/5"
                        : "border-lost/20 bg-lost/5"
                    }`}
                  >
                    <p className="text-sm font-semibold text-ink">
                      {meta.label} and what happens next
                    </p>
                    <p className="mt-1 text-sm leading-6 text-mute">
                      {isOwner ? meta.next : meta.note}
                    </p>
                  </div>

                  {isOwner ? (
                    <RequestActions request={request} />
                  ) : isClaimant ? (
                    <p className="mt-4 text-sm leading-6 text-mute">
                      This is a request you submitted. Status updates are handled
                      by the lost item owner.
                    </p>
                  ) : null}
                </Reveal>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default RecoveryRequestsPage;