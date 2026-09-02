import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { FoundItemContext } from "../context/FoundItemContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";

const CATEGORIES = [
  "Electronics",
  "Accessories",
  "Books",
  "Documents",
  "Keys",
  "Other",
];

const required = (value) =>
  value && typeof value === "string" ? value.trim().length > 0 : false;

function validateForm(data) {
  const errors = {};

  if (!required(data.itemName)) {
    errors.itemName = "Item name is required.";
  }

  if (!required(data.category)) {
    errors.category = "Please select a category.";
  }

  if (!required(data.description)) {
    errors.description = "Description is required.";
  }

  if (!required(data.location)) {
    errors.location = "Location is required.";
  }

  if (!data.dateFound) {
    errors.dateFound = "Please select a date.";
  } else {
    const selected = new Date(data.dateFound);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selected > today) {
      errors.dateFound = "Date cannot be in the future.";
    }
  }

  if (!required(data.contact)) {
    errors.contact = "Contact details are required.";
  }

  return errors;
}

function ReportFound() {
  const { foundItems, setFoundItems } = useContext(FoundItemContext);

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    location: "",
    dateFound: "",
    contact: "",
  });

  const [errors, setErrors] = useState({});
  const [submissionError, setSubmissionError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return prev;
    });

    setSubmissionError("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting || isLoading) {
      return;
    }

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    setSubmissionError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);

    try {
      const newItem = {
        id: Date.now(),
        ...formData,
      };

      setFoundItems([...foundItems, newItem]);

      setFormData({
        itemName: "",
        category: "",
        description: "",
        location: "",
        dateFound: "",
        contact: "",
      });

      setErrors({});
      setSubmissionError("");
      setSuccess(true);
    } catch (error) {
      console.error("Error:", error);
      setSubmissionError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <PageShell
        title="Report a Found Item"
        description="Help reunite a lost item with its owner by reporting what you found."
      >
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-[6px] border border-line bg-surface p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canopy text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="mb-2 font-serif text-2xl font-semibold text-ink">
              Submitted Successfully
            </h2>
            <p className="mb-6 text-mute">
              Thank you for helping. The found item is now listed so its owner
              can see it and get in touch with you.
            </p>
            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-center">
              <Button variant="secondary" to="/found-items">
                Back to Found Items
              </Button>
              <Button
                variant="save"
                onClick={() => setSuccess(false)}
                type="button"
              >
                Report Another Item
              </Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Report a Found Item"
      description="Help someone get their property back by sharing details about the item you found."
      action={
        <Button variant="secondary" to="/found-items">
          Back to Found Items
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-[6px] border border-line bg-surface p-5 sm:p-8"
        >
          {submissionError && (
            <div
              className="mb-6 rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
              role="alert"
            >
              <p className="font-semibold">Submission failed</p>
              <p className="mt-1">{submissionError}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="itemName"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Item Name
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="itemName"
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                placeholder="e.g. Black smartphone"
                autoComplete="off"
                aria-invalid={errors.itemName ? "true" : "false"}
                aria-describedby={errors.itemName ? "itemName-error" : undefined}
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.itemName
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              <p className="mt-1.5 text-xs text-mute">
                A short, clear name for the item you found.
              </p>
              {errors.itemName && (
                <p
                  id="itemName-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.itemName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Category
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                aria-invalid={errors.category ? "true" : "false"}
                aria-describedby={
                  errors.category ? "category-error" : undefined
                }
                className={`w-full min-h-[44px] cursor-pointer rounded-[6px] border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.category
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-mute">
                Choose the category that best matches the item.
              </p>
              {errors.category && (
                <p
                  id="category-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Description
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Black smartphone in a clear case. Locked screen shows a photo of a dog."
                rows="5"
                aria-invalid={errors.description ? "true" : "false"}
                aria-describedby={
                  errors.description ? "description-error" : undefined
                }
                className={`w-full rounded-[6px] border px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 resize-y ${
                  errors.description
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              <p className="mt-1.5 text-xs text-mute">
                Include details that only the owner would recognise — do not
                include anything private or sensitive.
              </p>
              {errors.description && (
                <p
                  id="description-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Location Found
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Classroom 204, near the projector"
                autoComplete="off"
                aria-invalid={errors.location ? "true" : "false"}
                aria-describedby={errors.location ? "location-error" : undefined}
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.location
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              <p className="mt-1.5 text-xs text-mute">
                Building, room number, or exact area where you found the item.
              </p>
              {errors.location && (
                <p
                  id="location-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.location}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="dateFound"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Date Found
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="dateFound"
                type="date"
                name="dateFound"
                value={formData.dateFound}
                onChange={handleChange}
                aria-invalid={errors.dateFound ? "true" : "false"}
                aria-describedby={
                  errors.dateFound ? "dateFound-error" : undefined
                }
                className={`w-full min-h-[44px] cursor-pointer rounded-[6px] border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.dateFound
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              <p className="mt-1.5 text-xs text-mute">
                The date on which the item was discovered.
              </p>
              {errors.dateFound && (
                <p
                  id="dateFound-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.dateFound}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="contact"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Contact Details
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="contact"
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="e.g. 9876543210 or your.name@campus.edu"
                autoComplete="off"
                maxLength={30}
                aria-invalid={errors.contact ? "true" : "false"}
                aria-describedby={errors.contact ? "contact-error" : undefined}
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.contact
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              <p className="mt-1.5 text-xs text-mute">
                Your phone number or email so the owner can contact you.
              </p>
              {errors.contact && (
                <p
                  id="contact-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.contact}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-between">
            <Link
              to="/found-items"
              className="min-h-[44px] inline-flex items-center justify-center rounded-[6px] px-4 text-sm font-semibold text-ink transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper hover:text-mute"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="save"
              disabled={isLoading || isSubmitting}
              aria-disabled={isLoading || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Found Item"
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

export default ReportFound;
