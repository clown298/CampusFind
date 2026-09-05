import { useContext, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LostItemContext } from "../context/LostItemContext";
import { FoundItemContext } from "../context/FoundItemContext";
import { AuthContext } from "../context/AuthContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import PossibleMatches from "../components/PossibleMatches";
import { formatDisplayDate, getItemName, getItemDate } from "../utils/items";

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

function toDateInputValue(rawDate) {
  if (!rawDate) return "";
  const m = String(rawDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const parsed = new Date(rawDate);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
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

  if (!data.dateField) {
    errors.dateField = "Please select a date.";
  } else {
    const selected = new Date(data.dateField);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selected > today) {
      errors.dateField = "Date cannot be in the future.";
    }
  }

  if (!required(data.contact)) {
    errors.contact = "Contact details are required.";
  }

  return errors;
}

function ArrowLeftIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ItemDetails({ type }) {
  const isFound = type === "found";
  const statusLabel = isFound ? "Found" : "Lost";
  const accentClass = isFound ? "text-canopy" : "text-brick";
  const badgeClass = isFound
    ? "border-canopy text-canopy"
    : "border-brick text-brick";
  const dateKey = isFound ? "dateFound" : "dateLost";
  const dateLabel = isFound ? "Date Found" : "Date Lost";
  const locationLabel = isFound ? "Location Found" : "Location Lost";
  const listPath = isFound ? "/found-items" : "/lost-items";
  const reportPath = isFound ? "/report-found" : "/report-lost";
  const reportVariant = isFound ? "save" : "primary";

  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const lostCtx = useContext(LostItemContext);
  const foundCtx = useContext(FoundItemContext);

  const items = isFound ? foundCtx.foundItems : lostCtx.lostItems;
  const deleteItem = isFound ? foundCtx.deleteFoundItem : lostCtx.deleteLostItem;
  const updateItem = isFound
    ? foundCtx.updateFoundItem
    : lostCtx.updateLostItem;
  const isLoading = isFound ? foundCtx.isLoading : lostCtx.isLoading;

  const oppositeItems = isFound ? lostCtx.lostItems : foundCtx.foundItems;
  const oppositeLoading = isFound ? lostCtx.isLoading : foundCtx.isLoading;
  const oppositeLoadError = isFound ? lostCtx.loadError : foundCtx.loadError;

  const item = useMemo(() => {
    const found = items.find((i) => String(i.id) === String(id));
    return found || null;
  }, [items, id]);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errors, setErrors] = useState({});
  const [actionError, setActionError] = useState(null);

  const [itemName, setItemName] = useState(item ? getItemName(item) : "");
  const [category, setCategory] = useState(item?.category || "");
  const [description, setDescription] = useState(item?.description || "");
  const [location, setLocation] = useState(item?.location || "");
  const [dateField, setDateField] = useState(
    item
      ? toDateInputValue(
          item.dateFound || item.dateLost || item.date_found || item.date_lost || ""
        )
      : ""
  );
  const [contact, setContact] = useState(item?.contact || "");
  const [imageData, setImageData] = useState(item?.imageData || undefined);

  function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setErrors((prev) => ({ ...prev, image: validationError }));
      setImageData(undefined);
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
      setImageData(String(reader.result || ""));
    };
    reader.onerror = () => {
      setErrors((prev) => ({ ...prev, image: "Could not read the image file." }));
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  }

  function handleClearImage(e) {
    if (e) e.preventDefault();
    setImageData(undefined);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
  }

  function startEditing() {
    if (!item) return;
    setConfirmingDelete(false);
    setActionError(null);
    setItemName(getItemName(item));
    setCategory(item.category || "");
    setDescription(item.description || "");
    setLocation(item.location || "");
    setDateField(
      toDateInputValue(
        item.dateFound || item.dateLost || item.date_found || item.date_lost || ""
      )
    );
    setContact(item.contact || "");
    setImageData(item.imageData || undefined);
    setErrors({});
    setEditing(true);
  }

  function handleCancelEdit() {
    if (!item) return;
    setActionError(null);
    setItemName(getItemName(item));
    setCategory(item.category || "");
    setDescription(item.description || "");
    setLocation(item.location || "");
    setDateField(
      toDateInputValue(
        item.dateFound || item.dateLost || item.date_found || item.date_lost || ""
      )
    );
    setContact(item.contact || "");
    setImageData(item.imageData || undefined);
    setErrors({});
    setEditing(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!item) return;

    const validationErrors = validateForm({
      itemName,
      category,
      description,
      location,
      dateField,
      contact,
    });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const updatedItem = {
      ...item,
      itemName,
      category,
      description,
      location,
      contact,
      [dateKey]: dateField,
      imageData: imageData || undefined,
    };

    try {
      setActionError(null);
      await updateItem(updatedItem);
      setEditing(false);
    } catch (error) {
      console.error("Error updating item:", error);
      setActionError(
        (error && error.message) ||
          "Could not save your changes. Please try again."
      );
    }
  }

  function handleCancelDelete() {
    setActionError(null);
    setConfirmingDelete(false);
  }

  async function handleConfirmDelete() {
    if (!item) return;
    try {
      setActionError(null);
      await deleteItem(item.id);
      setConfirmingDelete(false);
      navigate(listPath);
    } catch (error) {
      console.error("Error deleting item:", error);
      setActionError(
        (error && error.message) ||
          "Could not delete the item. Please try again."
      );
      setConfirmingDelete(false);
    }
  }

  if (isLoading) {
    return (
      <PageShell
        title={`${statusLabel} Item Details`}
        description={`View the full details of a ${statusLabel.toLowerCase()} item reported on campus.`}
      >
        <div
          className="mx-auto w-full max-w-3xl rounded-[8px] border border-line bg-surface px-5 py-10 text-center sm:px-8"
          role="status"
        >
          <p className="text-sm font-semibold text-mute">
            Loading {statusLabel.toLowerCase()} item…
          </p>
        </div>
      </PageShell>
    );
  }

  if (!item) {
    return (
      <PageShell
        title={`${statusLabel} Item Details`}
        description={`View the full details of a ${statusLabel.toLowerCase()} item reported on campus.`}
      >
        <EmptyState
          title="Item not found"
          description={`The ${statusLabel.toLowerCase()} item you are looking for may have been removed or the link may be incorrect.`}
          actionLabel={`Back to ${statusLabel} Items`}
          actionTo={listPath}
          variant={reportVariant}
        />
      </PageShell>
    );
  }

  const displayName = getItemName(item);
  const displayDate = formatDisplayDate(getItemDate(item, type));
  const canManage = Boolean(
    user && item.userId && String(item.userId) === String(user.id)
  );

  const shellTitle = `${displayName || statusLabel + " Item"} — ${statusLabel}`;
  const shellDescription = isFound
    ? "Full details of an item found on campus. If this belongs to you, use the contact details to arrange its return."
    : "Full details of an item reported missing on campus. If you have found this item, use the contact details to help return it.";

  return (
    <PageShell
      title={shellTitle}
      description={shellDescription}
      action={
        <Button
          to={listPath}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          <span className="flex items-center gap-1.5">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to {statusLabel} Items
          </span>
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-3xl">
        {editing ? (
          <form
            onSubmit={handleSave}
            noValidate
            className="rounded-[8px] border border-line bg-surface p-5 sm:p-8"
          >
            <p
              className={`text-xs font-semibold uppercase tracking-[0.12em] ${accentClass}`}
            >
              Editing {statusLabel.toLowerCase()} item
            </p>

            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink">
              Edit Item Details
            </h2>

            {actionError && (
              <div
                className="mt-4 rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
                role="alert"
              >
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-1">{actionError}</p>
              </div>
            )}

            <div className="mt-6 space-y-6">
              <div>
                <label
                  htmlFor="edit-itemName"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  Item Name
                  <span className="ml-1 text-lost" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  id="edit-itemName"
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  aria-invalid={errors.itemName ? "true" : "false"}
                  aria-describedby={
                    errors.itemName ? "edit-itemName-error" : undefined
                  }
                  className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                    errors.itemName
                      ? "border-lost bg-lost/5 focus-visible:ring-lost"
                      : "border-line bg-paper hover:border-mute/40"
                  }`}
                />
                {errors.itemName && (
                  <p
                    id="edit-itemName-error"
                    className="mt-1.5 text-sm font-medium text-lost"
                  >
                    {errors.itemName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-category"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  Category
                  <span className="ml-1 text-lost" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </label>
                <select
                  id="edit-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-invalid={errors.category ? "true" : "false"}
                  aria-describedby={
                    errors.category ? "edit-category-error" : undefined
                  }
                  className={`w-full min-h-[44px] cursor-pointer rounded-[6px] border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                    errors.category
                      ? "border-lost bg-lost/5 focus-visible:ring-lost"
                      : "border-line bg-paper hover:border-mute/40"
                  }`}
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
                    id="edit-category-error"
                    className="mt-1.5 text-sm font-medium text-lost"
                  >
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-description"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  Description
                  <span className="ml-1 text-lost" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="5"
                  aria-invalid={errors.description ? "true" : "false"}
                  aria-describedby={
                    errors.description ? "edit-description-error" : undefined
                  }
                  className={`w-full rounded-[6px] border px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 resize-y ${
                    errors.description
                      ? "border-lost bg-lost/5 focus-visible:ring-lost"
                      : "border-line bg-paper hover:border-mute/40"
                  }`}
                />
                {errors.description && (
                  <p
                    id="edit-description-error"
                    className="mt-1.5 text-sm font-medium text-lost"
                  >
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-location"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  {locationLabel}
                  <span className="ml-1 text-lost" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  id="edit-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  aria-invalid={errors.location ? "true" : "false"}
                  aria-describedby={
                    errors.location ? "edit-location-error" : undefined
                  }
                  className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                    errors.location
                      ? "border-lost bg-lost/5 focus-visible:ring-lost"
                      : "border-line bg-paper hover:border-mute/40"
                  }`}
                />
                {errors.location && (
                  <p
                    id="edit-location-error"
                    className="mt-1.5 text-sm font-medium text-lost"
                  >
                    {errors.location}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-date"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  {dateLabel}
                  <span className="ml-1 text-lost" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  id="edit-date"
                  type="date"
                  value={dateField}
                  onChange={(e) => setDateField(e.target.value)}
                  aria-invalid={errors.dateField ? "true" : "false"}
                  aria-describedby={
                    errors.dateField ? "edit-date-error" : undefined
                  }
                  className={`w-full min-h-[44px] cursor-pointer rounded-[6px] border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                    errors.dateField
                      ? "border-lost bg-lost/5 focus-visible:ring-lost"
                      : "border-line bg-paper hover:border-mute/40"
                  }`}
                />
                {errors.dateField && (
                  <p
                    id="edit-date-error"
                    className="mt-1.5 text-sm font-medium text-lost"
                  >
                    {errors.dateField}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-contact"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  Contact Details
                  <span className="ml-1 text-lost" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  id="edit-contact"
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  maxLength={30}
                  aria-invalid={errors.contact ? "true" : "false"}
                  aria-describedby={
                    errors.contact ? "edit-contact-error" : undefined
                  }
                  className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                    errors.contact
                      ? "border-lost bg-lost/5 focus-visible:ring-lost"
                      : "border-line bg-paper hover:border-mute/40"
                  }`}
                />
                {errors.contact && (
                  <p
                    id="edit-contact-error"
                    className="mt-1.5 text-sm font-medium text-lost"
                  >
                    {errors.contact}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-image"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  Photo (optional)
                </label>
                {imageData ? (
                  <div className="rounded-[6px] border border-line bg-paper p-3">
                    <div className="overflow-hidden rounded-[4px] border border-line bg-surface">
                      <img
                        src={imageData}
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
                      htmlFor="edit-image"
                      className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed px-4 py-6 text-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                        errors.image
                          ? "border-lost bg-lost/5"
                          : "border-line bg-paper hover:border-mute/50"
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
                      id="edit-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      aria-invalid={errors.image ? "true" : "false"}
                      aria-describedby={errors.image ? "edit-image-error" : undefined}
                      className="sr-only"
                    />
                    {errors.image && (
                      <p
                        id="edit-image-error"
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
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={reportVariant}
                className="w-full sm:w-auto"
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <article className="rounded-[8px] border border-line bg-surface p-5 sm:p-8">
            {actionError && (
              <div
                className="mb-6 rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
                role="alert"
              >
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-1">{actionError}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-flex rounded-[4px] border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] ${badgeClass}`}
              >
                {statusLabel}
              </span>
              <span className="text-sm text-mute">{item.category}</span>
            </div>

            <h1
              className={`mt-4 break-words font-serif text-3xl font-semibold sm:text-4xl ${accentClass}`}
            >
              {displayName}
            </h1>

            {item.imageData && (
              <div className="mt-6 overflow-hidden rounded-[6px] border border-line bg-ink/5">
                <img
                  src={item.imageData}
                  alt=""
                  className="max-h-[420px] w-full object-contain"
                />
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mute">
                  Category
                </p>
                <p className="mt-1.5 break-words text-base font-medium text-ink">
                  {item.category}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mute">
                  {dateLabel}
                </p>
                <p className="mt-1.5 break-words text-base font-medium text-ink">
                  {displayDate}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mute">
                  {locationLabel}
                </p>
                <p className="mt-1.5 break-words text-base font-medium text-ink">
                  {item.location}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mute">
                  Description
                </p>
                <p className="mt-1.5 whitespace-pre-wrap break-words text-base leading-7 text-ink">
                  {item.description}
                </p>
              </div>

              <div className="sm:col-span-2">
                <div className="rounded-[6px] border border-line bg-paper p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mute">
                    Contact Information
                  </p>
                  <p className="mt-2 break-words text-base font-medium text-ink">
                    {item.contact}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-mute">
                    {isFound
                      ? "This is the person who found the item. Reach out to arrange a safe return on campus."
                      : "This is the person who reported the item missing. Get in touch if you found it."}
                  </p>
                </div>
              </div>
            </div>

            {confirmingDelete ? (
              <div
                className="mt-8 rounded-[6px] border border-line bg-paper p-5"
                role="group"
                aria-label="Confirm delete"
              >
                <p className="text-base font-semibold text-ink">
                  Delete this {statusLabel.toLowerCase()} item?
                </p>
                <p className="mt-1 text-sm leading-6 text-mute">
                  "{displayName || "This item"}" will be removed from the{" "}
                  {statusLabel.toLowerCase()} items list. This cannot be undone.
                </p>
                <div className="mt-5 flex flex-col-reverse items-stretch gap-3 sm:flex-row">
                  <Button variant="secondary" onClick={handleCancelDelete}>
                    Cancel
                  </Button>
                  <Button variant="dangerSolid" onClick={handleConfirmDelete}>
                    Yes, Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-between">
                {canManage ? (
                <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row">
                  <Button
                    variant="secondary"
                    onClick={startEditing}
                    className="w-full sm:w-auto"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setConfirmingDelete(true)}
                    className="w-full sm:w-auto"
                  >
                    Delete
                  </Button>
                </div>
              ) : null}
              <Button
                to={reportPath}
                variant={reportVariant}
                className="w-full sm:w-auto"
              >
                Report Another {statusLabel} Item
              </Button>
              </div>
            )}
          </article>
        )}

        {!editing ? (
          <PossibleMatches
            type={type}
            item={item}
            candidates={oppositeItems}
            candidatesLoading={oppositeLoading}
            candidatesLoadError={oppositeLoadError}
          />
        ) : null}
      </div>
    </PageShell>
  );
}

export default ItemDetails;
