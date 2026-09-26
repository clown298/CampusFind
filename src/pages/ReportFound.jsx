import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FoundItemContext } from "../context/FoundItemContext";
import { AuthContext } from "../context/AuthContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";
import TypeChip from "../components/TypeChip";
import { FoundIcon } from "../components/icons";

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

const eyebrow = "GCOEC • Campus Lost & Found";

const fieldClass = (hasError) =>
  [
    "w-full min-h-[44px] rounded-control border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150",
    hasError
      ? "border-lost bg-lost/5 focus-visible:ring-lost"
      : "border-line bg-surface hover:border-mute/40",
  ].join(" ");

function SectionHeading({ number, title, hint, toneClass }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${toneClass}`}
          aria-hidden="true"
        >
          {number}
        </span>
        <h2 className="type-card text-lg text-ink">{title}</h2>
      </div>
      {hint ? <p className="mt-1.5 text-sm leading-6 text-mute">{hint}</p> : null}
    </div>
  );
}

function ReportFound() {
  const { addFoundItem } = useContext(FoundItemContext);
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    location: "",
    dateFound: "",
    contact: "",
    imageData: undefined,
  });

  const [errors, setErrors] = useState({});
  const [submissionError, setSubmissionError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

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

  function acceptImage(file) {
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setErrors((prev) => ({ ...prev, image: validationError }));
      setFormData((prev) => ({ ...prev, imageData: undefined }));
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
  }

  function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    acceptImage(file);
    if (e.target) e.target.value = "";
  }

  function handleImageDrop(e) {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    acceptImage(file);
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

    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: location.pathname, search: location.search } },
      });
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
      await addFoundItem(formData);

      setFormData({
        itemName: "",
        category: "",
        description: "",
        location: "",
        dateFound: "",
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
          : (error && error.message) || "Failed to save found item."
      );
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <PageShell
        title="Report a found item"
        description="Describe the item you found so its owner can get it back."
        eyebrow={eyebrow}
        icon={<TypeChip tone="found" icon={FoundIcon} label="Found report" />}
        tone="found"
      >
        <div className="mx-auto w-full max-w-[800px]">
          <div className="animate-menu-in rounded-card border border-line bg-surface p-8 text-center sm:p-10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-control bg-canopy text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="type-section text-2xl text-ink">
              Submitted Successfully
            </h2>
            <p className="mx-auto mt-2 max-w-md text-base leading-6 text-mute">
              Thank you for helping. The found item is now listed so its owner
              can see it and get in touch with you.
            </p>
            <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-center">
              <Button variant="secondary" to="/found-items">
                Back to Found Items
              </Button>
              <Button
                variant="found"
                onClick={() => setSuccess(false)}
                type="button"
                className="w-full sm:w-auto"
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
      title="Report a found item"
      description="Describe the item you found so its owner can recognise it and reach out to you."
      eyebrow={eyebrow}
      icon={<TypeChip tone="found" icon={FoundIcon} label="Found report" />}
      tone="found"
      action={
        <Button variant="secondary" to="/found-items">
          Back to Found Items
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-[800px]">
        {!isAuthenticated ? (
          <div className="mb-6 rounded-card border border-found/30 bg-found/5 p-4 text-sm sm:p-5">
            <p className="font-semibold text-ink">
              Sign in to report a found item
            </p>
            <p className="mt-1 leading-6 text-mute">
              You can keep browsing as a guest, but submitting a found item
              report requires an account so you can manage it later.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button
                variant="primary"
                to="/login"
                state={{ from: { pathname: location.pathname, search: location.search } }}
              >
                Login
              </Button>
              <Button
                variant="secondary"
                to="/register"
                state={{ from: { pathname: location.pathname, search: location.search } }}
              >
                Register
              </Button>
            </div>
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-card border border-line bg-surface p-5 sm:p-8"
        >
          <div className="flex items-center gap-3 border-b border-line pb-5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-found text-white">
              <FoundIcon size={20} />
            </span>
            <div>
              <p className="type-card text-lg text-ink">
                New found report
              </p>
              <p className="mt-0.5 text-sm leading-6 text-mute">
                Three short sections. Add a photo if you have one.
              </p>
            </div>
          </div>

          {submissionError && (
            <div
              className="mt-6 rounded-card border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
              role="alert"
            >
              <p className="font-semibold">Submission failed</p>
              <p className="mt-1">{submissionError}</p>
            </div>
          )}

          <div className="divide-y divide-line">
            <section className="py-6 first:pt-6">
              <SectionHeading
                number="1"
                title="What was it?"
                hint="A clear name and description help the owner recognise the item."
                toneClass="bg-found/10 text-found"
              />
              <div className="mt-5 space-y-6">
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
                    maxLength={100}
                    autoComplete="off"
                    aria-invalid={errors.itemName ? "true" : "false"}
                    aria-describedby={
                      errors.itemName ? "itemName-error" : undefined
                    }
                    className={fieldClass(errors.itemName)}
                  />
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
                    className={`${fieldClass(errors.category)} cursor-pointer`}
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
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
                    className={`w-full rounded-control border px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 resize-y ${
                      errors.description
                        ? "border-lost bg-lost/5 focus-visible:ring-lost"
                        : "border-line bg-surface hover:border-mute/40"
                    }`}
                  />
                  <p className="mt-1.5 text-xs text-mute">
                    Include details that only the owner would recognise; do not
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
              </div>
            </section>

            <section className="py-6">
              <SectionHeading
                number="2"
                title="Where and when?"
                hint="Where you found the item and the date you picked it up."
                toneClass="bg-found/10 text-found"
              />
              <div className="mt-5 space-y-6">
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
                    maxLength={150}
                    autoComplete="off"
                    aria-invalid={errors.location ? "true" : "false"}
                    aria-describedby={
                      errors.location ? "location-error" : undefined
                    }
                    className={fieldClass(errors.location)}
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
                    className={fieldClass(errors.dateFound)}
                  />
                  {errors.dateFound && (
                    <p
                      id="dateFound-error"
                      className="mt-1.5 text-sm font-medium text-lost"
                    >
                      {errors.dateFound}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="py-6 last:pb-6">
              <SectionHeading
                number="3"
                title="Contact and photo"
                hint="How the owner can reach you, plus an optional photo of the item."
                toneClass="bg-found/10 text-found"
              />
              <div className="mt-5 space-y-6">
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
                    aria-describedby={
                      errors.contact ? "contact-error" : undefined
                    }
                    className={fieldClass(errors.contact)}
                  />
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
                    htmlFor="found-image"
                    className="mb-1.5 block text-sm font-semibold text-ink"
                  >
                    Item Image (optional)
                  </label>
                  {formData.imageData ? (
                    <div className="rounded-control border border-line bg-surface p-3">
                      <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-control border border-line bg-paper sm:h-80">
                        <img
                          src={formData.imageData}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="mt-3 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-between">
                        <p className="text-xs text-mute">
                          Photo will be saved with your report.
                        </p>
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-control border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:border-mute/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                        >
                          Remove photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="found-image"
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setIsDraggingImage(true);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "copy";
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingImage(false);
                        }}
                        onDrop={handleImageDrop}
                        className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed px-4 py-6 text-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                          errors.image
                            ? "border-lost bg-lost/5"
                            : isDraggingImage
                              ? "border-ink bg-paper"
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
                            {errors.image
                              ? errors.image
                              : "Drag and drop an image, or click to choose"}
                          </p>
                          <p className="mt-1 text-xs text-mute">
                            JPEG, PNG, or WebP. Maximum 500 KB.
                          </p>
                        </div>
                      </label>
                      <input
                        id="found-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        aria-invalid={errors.image ? "true" : "false"}
                        aria-describedby={
                          errors.image ? "found-image-error" : undefined
                        }
                        className="sr-only"
                      />
                      {errors.image && (
                        <p
                          id="found-image-error"
                          className="mt-1.5 text-sm font-medium text-lost"
                        >
                          {errors.image}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
            <Link
              to="/found-items"
              className="min-h-[44px] inline-flex items-center justify-center rounded-control px-4 text-sm font-semibold text-ink transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface hover:text-mute"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="found"
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