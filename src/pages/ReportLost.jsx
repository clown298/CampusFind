import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { LostItemContext } from "../context/LostItemContext";
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

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const MAX_IMAGE_BYTES = 500 * 1024;

const required = (value) =>
  value && typeof value === "string" ? value.trim().length > 0 : false;

function validateImageFile(file) {
  if (!file) return null;
  const nameOk = ALLOWED_IMAGE_EXT.test(file.name || "");
  const typeOk = !file.type || ALLOWED_IMAGE_TYPES.includes(file.type);
  if (!nameOk && !typeOk) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be smaller than 500 KB.";
  }
  return null;
}

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

  if (!data.dateLost) {
    errors.dateLost = "Please select a date.";
  } else {
    const selected = new Date(data.dateLost);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selected > today) {
      errors.dateLost = "Date cannot be in the future.";
    }
  }

  if (!required(data.contact)) {
    errors.contact = "Contact details are required.";
  }

  return errors;
}

function ReportLost() {
  const { addLostItem } = useContext(LostItemContext);

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    location: "",
    dateLost: "",
    contact: "",
    imageData: undefined,
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

  function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setErrors((prev) => ({ ...prev, image: validationError }));
      setFormData((prev) => ({ ...prev, imageData: undefined }));
      if (e.target) e.target.value = "";
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, imageData: String(reader.result || "") }));
    };
    reader.onerror = () => {
      setErrors((prev) => ({ ...prev, image: "Could not read the image file." }));
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  }

  function handleClearImage(e) {
    if (e) e.preventDefault();
    setFormData((prev) => ({ ...prev, imageData: undefined }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
  }

  async function handleSubmit(e) {
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
      await addLostItem(formData);

      setFormData({
        itemName: "",
        category: "",
        description: "",
        location: "",
        dateLost: "",
        contact: "",
        imageData: undefined,
      });

      setErrors({});
      setSubmissionError("");
      setSuccess(true);
    } catch (error) {
      console.error("Error:", error);
      setSubmissionError(
        error && error.code === "NETWORK_ERROR"
          ? "Could not connect to the backend. Please try again."
          : (error && error.message) || "Failed to save lost item."
      );
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <PageShell
        title="Report a Lost Item"
        description="Fill in the details below to help someone find their lost property."
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
              Your lost item report has been recorded. It will appear in the
              lost items list so others can help you find it.
            </p>
            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-center">
              <Button variant="secondary" to="/lost-items">
                Back to Lost Items
              </Button>
              <Button
                variant="primary"
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
      title="Report a Lost Item"
      description="Fill in the details below to help the campus community reunite you with your property."
      action={
        <Button variant="secondary" to="/lost-items">
          Back to Lost Items
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
                placeholder="e.g. Blue leather wallet"
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
                A short, clear name for the item.
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
                placeholder="e.g. Small brown wallet with a university ID card and a Metro pass inside."
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
                Include distinguishing marks, contents, colours, or anything
                that helps identify the item.
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
                Location Lost
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
                placeholder="e.g. Main Library, second floor reading area"
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
                Building, floor, or area where the item was last seen.
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
                htmlFor="dateLost"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Date Lost
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="dateLost"
                type="date"
                name="dateLost"
                value={formData.dateLost}
                onChange={handleChange}
                aria-invalid={errors.dateLost ? "true" : "false"}
                aria-describedby={errors.dateLost ? "dateLost-error" : undefined}
                className={`w-full min-h-[44px] cursor-pointer rounded-[6px] border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.dateLost
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              <p className="mt-1.5 text-xs text-mute">
                When you last had or noticed the item missing.
              </p>
              {errors.dateLost && (
                <p
                  id="dateLost-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.dateLost}
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
                placeholder="e.g. 9876543210 or student.roll@campus.edu"
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
                Phone number or email so someone can reach you.
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

            <div>
              <label
                htmlFor="lost-image"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Photo (optional)
              </label>
              {formData.imageData ? (
                <div className="rounded-[6px] border border-line bg-paper p-3">
                  <div className="overflow-hidden rounded-[4px] border border-line bg-surface">
                    <img
                      src={formData.imageData}
                      alt=""
                      className="h-56 w-full object-contain bg-ink/5"
                    />
                  </div>
                  <div className="mt-3 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-between">
                    <p className="text-xs text-mute">
                      Photo will be saved with your report.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="inline-flex min-h-[36px] items-center justify-center rounded-[4px] border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors duration-150 hover:border-mute/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="lost-image"
                    className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed px-4 py-6 text-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                      errors.image
                        ? "border-lost bg-lost/5"
                        : "border-line bg-surface hover:border-mute/50"
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
                      className={`h-6 w-6 ${errors.image ? "text-lost" : "text-mute"}`}
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <div>
                      <p className={`text-sm font-semibold ${errors.image ? "text-lost" : "text-ink"}`}>
                        {errors.image ? errors.image : "Click to choose a photo"}
                      </p>
                      <p className="mt-1 text-xs text-mute">
                        JPEG, PNG, or WebP. Maximum 500 KB.
                      </p>
                    </div>
                  </label>
                  <input
                    id="lost-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    aria-invalid={errors.image ? "true" : "false"}
                    aria-describedby={errors.image ? "lost-image-error" : undefined}
                    className="sr-only"
                  />
                  {errors.image && (
                    <p
                      id="lost-image-error"
                      className="mt-1.5 text-sm font-medium text-lost"
                    >
                      {errors.image}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-between">
            <Link
              to="/lost-items"
              className="min-h-[44px] inline-flex items-center justify-center rounded-[6px] px-4 text-sm font-semibold text-ink transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper hover:text-mute"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
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
                "Submit Lost Item"
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

export default ReportLost;
