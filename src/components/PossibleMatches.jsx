import { useContext, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "./Button";
import { findPossibleMatches } from "../utils/matching";
import { formatDisplayDate, getItemDate, getItemName } from "../utils/items";
import { RecoveryRequestContext } from "../context/RecoveryRequestContext";
import { AuthContext } from "../context/AuthContext";

const RECOVERY_STATUS_META = {
  pending: { label: "Pending", classes: "border-line text-ink" },
  approved: { label: "Approved", classes: "border-canopy text-canopy" },
  rejected: { label: "Rejected", classes: "border-lost text-lost" },
  recovered: { label: "Recovered", classes: "border-canopy text-canopy" },
};

const RECOVERY_STATUS_NOTES = {
  pending:
    "A recovery request for this pair is pending approval.",
  approved:
    "Recovery request approved. The found item can now be returned.",
  rejected: "This recovery request was rejected.",
  recovered: "This recovery request was marked as recovered.",
};

const PROOF_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PROOF_IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const MAX_PROOF_IMAGES = 4;
const MAX_PROOF_IMAGE_BYTES = 500 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateProofImage(file) {
  if (!file) return null;
  const nameOk = PROOF_IMAGE_EXT.test(file.name || "");
  const typeOk = !file.type || PROOF_IMAGE_TYPES.includes(file.type);
  if (!nameOk && !typeOk) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size > MAX_PROOF_IMAGE_BYTES) {
    return "Image must be smaller than 500 KB.";
  }
  return null;
}

function RecoveryRequestForm({ lostItemId, foundItemId, existingRequest }) {
  const { createRecoveryRequest } = useContext(RecoveryRequestContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [claimantName, setClaimantName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [claimantPhone, setClaimantPhone] = useState("");
  const [claimantMessage, setClaimantMessage] = useState("");
  const [proofImages, setProofImages] = useState([]);
  const [proofError, setProofError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function requestRecovery() {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: location.pathname, search: location.search } },
      });
      return;
    }
    setOpen(true);
  }

  if (existingRequest) {
    const meta =
      RECOVERY_STATUS_META[existingRequest.status] ||
      RECOVERY_STATUS_META.pending;
    const note =
      RECOVERY_STATUS_NOTES[existingRequest.status] ||
      RECOVERY_STATUS_NOTES.pending;
    return (
      <div className="mt-3 rounded-[6px] border border-line bg-paper p-4">
        <p className="flex flex-wrap items-center gap-2 text-sm text-mute">
          <span
            className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] ${meta.classes}`}
          >
            {meta.label}
          </span>
          <span>{note}</span>
        </p>
      </div>
    );
  }

  function validateForm() {
    const next = {};
    if (!claimantName.trim()) next.claimantName = "Full name is required.";
    if (!claimantEmail.trim()) next.claimantEmail = "Email is required.";
    else if (!EMAIL_RE.test(claimantEmail.trim()))
      next.claimantEmail = "Enter a valid email address.";
    if (!claimantPhone.trim()) next.claimantPhone = "Phone number is required.";
    if (!claimantMessage.trim())
      next.claimantMessage = "Please describe why this item is yours.";
    return next;
  }

  function addProofFile(file) {
    if (!file) return;
    if (proofImages.length >= MAX_PROOF_IMAGES) {
      setProofError(`You can add up to ${MAX_PROOF_IMAGES} proof images.`);
      return;
    }
    const validationError = validateProofImage(file);
    if (validationError) {
      setProofError(validationError);
      return;
    }
    setProofError("");
    const reader = new FileReader();
    reader.onload = () => {
      setProofImages((prev) => [...prev, String(reader.result || "")]);
    };
    reader.readAsDataURL(file);
  }

  function handleProofInput(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    addProofFile(file);
    if (e.target) e.target.value = "";
  }

  function removeProofImage(index) {
    setProofImages((prev) => prev.filter((_, i) => i !== index));
    setProofError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validateForm();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await createRecoveryRequest({
        lostItemId,
        foundItemId,
        claimantName: claimantName.trim(),
        claimantEmail: claimantEmail.trim(),
        claimantPhone: claimantPhone.trim(),
        claimantMessage: claimantMessage.trim(),
        proofImages,
      });
      setOpen(false);
      setClaimantName("");
      setClaimantEmail("");
      setClaimantPhone("");
      setClaimantMessage("");
      setProofImages([]);
      setProofError("");
    } catch (error) {
      console.error("Error submitting recovery request:", error);
      setSubmitError(
        (error && error.message) ||
          "Could not submit your recovery request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      {submitError && (
        <div
          className="mb-3 rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
          role="alert"
        >
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-1">{submitError}</p>
        </div>
      )}

      {!open ? (
        <Button
          variant="secondary"
          onClick={requestRecovery}
          className="w-full sm:w-auto"
        >
          Request Recovery
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-[6px] border border-line bg-paper p-4"
        >
          <p className="text-sm font-semibold text-ink">
            Request recovery of this item
          </p>
          <p className="mt-1 text-sm leading-6 text-mute">
            Tell the item owner why this item is yours. Your request will be
            reviewed before the item is returned.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor={`recovery-name-${lostItemId}-${foundItemId}`}
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Full Name
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id={`recovery-name-${lostItemId}-${foundItemId}`}
                type="text"
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                maxLength={120}
                aria-invalid={errors.claimantName ? "true" : "false"}
                aria-describedby={
                  errors.claimantName
                    ? `recovery-name-error-${lostItemId}-${foundItemId}`
                    : undefined
                }
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition-colors duration-150 ${
                  errors.claimantName
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              {errors.claimantName && (
                <p
                  id={`recovery-name-error-${lostItemId}-${foundItemId}`}
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.claimantName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`recovery-email-${lostItemId}-${foundItemId}`}
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Email
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id={`recovery-email-${lostItemId}-${foundItemId}`}
                type="email"
                value={claimantEmail}
                onChange={(e) => setClaimantEmail(e.target.value)}
                maxLength={255}
                placeholder="you@campus.edu"
                autoComplete="email"
                aria-invalid={errors.claimantEmail ? "true" : "false"}
                aria-describedby={
                  errors.claimantEmail
                    ? `recovery-email-error-${lostItemId}-${foundItemId}`
                    : undefined
                }
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition-colors duration-150 ${
                  errors.claimantEmail
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              {errors.claimantEmail && (
                <p
                  id={`recovery-email-error-${lostItemId}-${foundItemId}`}
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.claimantEmail}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`recovery-phone-${lostItemId}-${foundItemId}`}
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Phone Number
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id={`recovery-phone-${lostItemId}-${foundItemId}`}
                type="tel"
                value={claimantPhone}
                onChange={(e) => setClaimantPhone(e.target.value)}
                maxLength={120}
                placeholder="e.g. 9876543210"
                autoComplete="tel"
                aria-invalid={errors.claimantPhone ? "true" : "false"}
                aria-describedby={
                  errors.claimantPhone
                    ? `recovery-phone-error-${lostItemId}-${foundItemId}`
                    : undefined
                }
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition-colors duration-150 ${
                  errors.claimantPhone
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              {errors.claimantPhone && (
                <p
                  id={`recovery-phone-error-${lostItemId}-${foundItemId}`}
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.claimantPhone}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`recovery-message-${lostItemId}-${foundItemId}`}
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Why is this item yours?
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <textarea
                id={`recovery-message-${lostItemId}-${foundItemId}`}
                value={claimantMessage}
                onChange={(e) => setClaimantMessage(e.target.value)}
                rows="4"
                maxLength={500}
                placeholder="Describe a detail only the owner would know, such as a mark or what was inside."
                aria-invalid={errors.claimantMessage ? "true" : "false"}
                aria-describedby={
                  errors.claimantMessage
                    ? `recovery-message-error-${lostItemId}-${foundItemId}`
                    : undefined
                }
                className={`w-full rounded-[6px] border px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition-colors duration-150 resize-y ${
                  errors.claimantMessage
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              {errors.claimantMessage && (
                <p
                  id={`recovery-message-error-${lostItemId}-${foundItemId}`}
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.claimantMessage}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label className="mb-1.5 block text-sm font-semibold text-ink">
                  Proof Images (Optional)
                </label>
                <span className="mb-1.5 inline-flex items-center rounded-[4px] border border-line bg-surface px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-mute">
                  Optional
                </span>
              </div>
              <p className="mb-3 text-sm leading-6 text-mute">
                Upload photos that help prove ownership, such as a previous
                photo or identifying feature.
              </p>

              {proofImages.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {proofImages.map((image, index) => (
                    <li
                      key={index}
                      className="rounded-[6px] border border-line bg-surface p-2"
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-24 w-full rounded-[4px] object-cover bg-ink/5"
                      />
                      <button
                        type="button"
                        onClick={() => removeProofImage(index)}
                        className="mt-2 inline-flex min-h-[36px] w-full items-center justify-center rounded-[4px] border border-line bg-surface px-2 text-xs font-semibold text-ink transition-colors duration-150 hover:border-lost hover:text-lost focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {proofImages.length < MAX_PROOF_IMAGES ? (
                <div>
                  <label
                    htmlFor={`recovery-proof-${lostItemId}-${foundItemId}`}
                    className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-dashed px-4 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                      proofError
                        ? "border-lost bg-lost/5 text-lost"
                        : "border-line bg-surface text-ink hover:border-mute/50"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Upload Proof Image
                  </label>
                  <input
                    id={`recovery-proof-${lostItemId}-${foundItemId}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProofInput}
                    className="sr-only"
                  />
                </div>
              ) : null}

              {proofError ? (
                <p
                  id={`recovery-proof-error-${lostItemId}-${foundItemId}`}
                  className="mt-1.5 text-sm font-medium text-lost"
                  role="alert"
                >
                  {proofError}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-mute">
                You can add up to {MAX_PROOF_IMAGES} images, each under 500 KB.
                Proof images are only shown to the item owner and the claimant.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="save"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function PossibleMatches({
  type,
  item,
  candidates,
  candidatesLoading,
  candidatesLoadError,
}) {
  const { recoveryRequests } = useContext(RecoveryRequestContext);
  const oppositeType = type === "found" ? "lost" : "found";
  const oppositeLabel = oppositeType === "found" ? "found items" : "lost items";

  const matches = useMemo(
    () => findPossibleMatches(item, candidates || [], type === "found"),
    [item, candidates, type]
  );

  function findExistingRequest(match) {
    const lostItemId =
      type === "found" ? match.item.id : item.id;
    const foundItemId =
      type === "found" ? item.id : match.item.id;
    const existing = recoveryRequests.find(
      (request) =>
        String(request.lostItemId) === String(lostItemId) &&
        String(request.foundItemId) === String(foundItemId)
    );
    return { lostItemId, foundItemId, existing };
  }

  return (
    <section className="mt-8 sm:mt-10">
      <h2 className="font-serif text-2xl font-semibold text-ink">
        Possible Matches
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
        The following {oppositeLabel} may describe the same physical item.
        These are suggestions based on name, category, location, date, and
        description — not confirmations.
      </p>

      {candidatesLoading ? (
        <div
          className="mt-4 rounded-[8px] border border-line bg-surface px-5 py-8 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-mute">
            Checking for possible matches…
          </p>
        </div>
      ) : candidatesLoadError ? (
        <div
          className="mt-4 rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
          role="alert"
        >
          <p className="font-semibold">Possible matches unavailable</p>
          <p className="mt-1">{candidatesLoadError}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-4 rounded-[8px] border border-line bg-surface px-5 py-8 text-center">
          <p className="text-sm text-mute">No possible matches found yet.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {matches.map((match) => {
            const detailPath =
              oppositeType === "found"
                ? `/found-items/${match.item.id}`
                : `/lost-items/${match.item.id}`;
            const accentClass =
              oppositeType === "found" ? "text-canopy" : "text-brick";
            const dateText = formatDisplayDate(
              getItemDate(match.item, oppositeType)
            );
            const { lostItemId, foundItemId, existing } =
              findExistingRequest(match);

            return (
              <li
                key={match.item.id}
                className="rounded-[8px] border border-line bg-surface p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to={detailPath}
                      className={`inline-block break-words font-serif text-xl font-semibold no-underline transition-colors duration-200 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-[4px] -m-1 p-1 ${accentClass}`}
                      aria-label={`View ${oppositeType} item: ${getItemName(match.item)}`}
                    >
                      {getItemName(match.item)}
                    </Link>

                    <dl className="mt-3 space-y-1 break-words text-sm text-ink">
                      <div>
                        <dt className="inline font-semibold">Category: </dt>
                        <dd className="inline">{match.item.category}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Location: </dt>
                        <dd className="inline">{match.item.location}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">
                          {oppositeType === "found" ? "Date found: " : "Date lost: "}
                        </dt>
                        <dd className="inline">{dateText}</dd>
                      </div>
                    </dl>

                    {match.reasons.length > 0 ? (
                      <p className="mt-3 text-sm font-medium leading-6 text-ink">
                        {match.reasons.join(" · ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 sm:pl-4">
                    <p className="inline-flex items-center rounded-[4px] border border-line bg-paper px-2.5 py-1 text-sm font-semibold text-ink">
                      {match.score}% match
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    to={detailPath}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    View item
                  </Button>
                  <RecoveryRequestForm
                    lostItemId={lostItemId}
                    foundItemId={foundItemId}
                    existingRequest={existing}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default PossibleMatches;