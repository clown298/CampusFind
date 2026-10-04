import { useContext, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LostItemContext } from "../context/LostItemContext";
import { FoundItemContext } from "../context/FoundItemContext";
import { AuthContext } from "../context/AuthContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import PossibleMatches from "../components/PossibleMatches";
import TypeChip from "../components/TypeChip";
import ItemImage from "../components/ItemImage";
import Reveal from "../components/Reveal";
import { LostIcon, FoundIcon, PinIcon, CalendarIcon } from "../components/icons";
import { formatDisplayDate, getItemName, getItemDate } from "../utils/items";
import { MAX_IMAGE_LABEL, prepareImageFile } from "../utils/images";

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
      strokeWidth="1.8"
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

const fieldClass = (hasError) =>
  [
    "w-full min-h-[44px] rounded-control border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150",
    hasError
      ? "border-lost bg-lost/5 focus-visible:ring-lost"
      : "border-line bg-surface hover:border-mute/40",
  ].join(" ");

function ItemDetails({ type }) {
  const isFound = type === "found";
  const statusLabel = isFound ? "Found" : "Lost";
  const dateKey = isFound ? "dateFound" : "dateLost";
  const dateLabel = isFound ? "Date Found" : "Date Lost";
  const locationLabel = isFound ? "Location Found" : "Location Lost";
  const listPath = isFound ? "/found-items" : "/lost-items";
  const reportPath = isFound ? "/report-found" : "/report-lost";
  const reportVariant = isFound ? "found" : "lost";

  const { id } = useParams();
  const navigate = useNavigate();

  const { user, isAdmin } = useContext(AuthContext);

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
  const [isPreparingImage, setIsPreparingImage] = useState(false);

  async function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsPreparingImage(true);
    try {
      // Large phone photos are resized and compressed before upload.
      setImageData(await prepareImageFile(file));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.image;
        return next;
      });
    } catch (error) {
      setImageData(undefined);
      setErrors((prev) => ({
        ...prev,
        image: (error && error.message) || "Could not read the image file.",
      }));
    } finally {
      setIsPreparingImage(false);
      if (e.target) e.target.value = "";
    }
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
          className="mx-auto w-full max-w-3xl rounded-card border border-line bg-surface px-5 py-10 text-center sm:px-8"
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
  const isOwner = Boolean(
    user && item.userId && String(item.userId) === String(user.id)
  );
  // Owners manage their own report; the campus admin can moderate any report.
  const canManage = isOwner || isAdmin;
  const adminModerating = isAdmin && !isOwner;

  function scrollToMatches() {
    const target = document.getElementById("possible-matches");
    if (!target) return;
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] overflow-x-clip px-4 py-8 sm:px-8">
      <Link
        to={listPath}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-control text-sm font-semibold text-mute transition-colors duration-200 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to {statusLabel} Items
      </Link>

      {editing ? (
        <form
          onSubmit={handleSave}
          noValidate
          className="animate-menu-in mt-6 mx-auto max-w-3xl rounded-card border border-line bg-surface p-5 sm:p-8"
        >
          <p className="text-sm font-semibold text-mute">
            Editing {statusLabel.toLowerCase()} item
          </p>

          <h1 className="type-title mt-3 text-2xl text-ink">
            Edit Item Details
          </h1>

          {actionError && (
            <div
              className="mt-4 rounded-card border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
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
                maxLength={100}
                aria-invalid={errors.itemName ? "true" : "false"}
                aria-describedby={
                  errors.itemName ? "edit-itemName-error" : undefined
                }
                className={fieldClass(errors.itemName)}
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
                className={`w-full rounded-control border px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 resize-y ${
                  errors.description
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
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
                maxLength={150}
                aria-invalid={errors.location ? "true" : "false"}
                aria-describedby={
                  errors.location ? "edit-location-error" : undefined
                }
                className={fieldClass(errors.location)}
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
                className={`${fieldClass(errors.dateField)} cursor-pointer`}
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
                className={fieldClass(errors.contact)}
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
                Item Image (optional)
              </label>
              {imageData ? (
                <div className="rounded-card border border-line bg-surface p-3">
                  <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-control border border-line bg-paper sm:h-80">
                    <img
                      src={imageData}
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
                      className="inline-flex min-h-[44px] items-center justify-center rounded-control border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors duration-150 hover:border-mute/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="edit-image"
                    className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed px-4 py-6 text-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
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
                      <p
                        className={`text-sm font-semibold ${
                          errors.image ? "text-lost" : isPreparingImage ? "text-mute" : "text-ink"
                        }`}
                      >
                        {errors.image
                          ? errors.image
                          : isPreparingImage
                            ? "Preparing your photo…"
                            : "Click to choose a photo"}
                      </p>
                      <p className="mt-1 text-xs text-mute">
                        JPEG, PNG, or WebP. Maximum {MAX_IMAGE_LABEL}. Larger
                        photos are resized automatically.
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
        <>
          <Reveal>
            <article className="mt-6 rounded-card border border-line bg-surface">
              {actionError && (
                <div
                  className="m-5 rounded-card border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
                  role="alert"
                >
                  <p className="font-semibold">Something went wrong</p>
                  <p className="mt-1">{actionError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-5">
                <div className="min-w-0 border-b border-line p-5 sm:p-6 lg:col-span-2 lg:border-b-0 lg:border-r">
                  <div
                    className={`overflow-hidden rounded-control border bg-paper ${
                      isFound ? "border-found/30" : "border-lost/30"
                    }`}
                  >
                    <ItemImage
                      type={type}
                      imageData={item.imageData}
                      alt={`Photo of ${displayName}`}
                      className="h-72 w-full sm:h-80 lg:h-96"
                    />
                  </div>
                </div>

                <div className="min-w-0 p-5 sm:p-6 lg:col-span-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeChip
                      tone={isFound ? "found" : "lost"}
                      icon={isFound ? FoundIcon : LostIcon}
                      label={isFound ? "Found item" : "Lost item"}
                    />
                    <span className="text-sm font-medium text-mute">
                      {item.category}
                    </span>
                  </div>

                  <h1 className="type-title mt-3 break-words text-2xl text-ink sm:text-3xl">
                    {displayName}
                  </h1>

                  <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-mute">
                        {dateLabel}
                      </dt>
                      <dd className="mt-1.5 flex min-w-0 items-center gap-1.5 break-words text-sm font-medium text-ink">
                        <CalendarIcon
                          size={16}
                          className="shrink-0 text-mute"
                          aria-hidden="true"
                        />
                        {displayDate}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-mute">
                        {locationLabel}
                      </dt>
                      <dd className="mt-1.5 flex min-w-0 items-center gap-1.5 break-words text-sm font-medium text-ink">
                        <PinIcon
                          size={16}
                          className="shrink-0 text-mute"
                          aria-hidden="true"
                        />
                        {item.location}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 rounded-card border border-line bg-paper p-4">
                    <p className="text-sm leading-6 text-ink">
                      {isFound
                        ? "This looks like yours? The possible matches below help you confirm ownership before arranging the return."
                        : "Found this item? The possible matches below link you to the owner for a safe recovery."}
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={scrollToMatches}
                      className="mt-3 w-full sm:w-auto"
                    >
                      See possible matches
                    </Button>
                  </div>

                  <h2 className="type-eyebrow mt-6 text-mute">Description</h2>
                  <p className="mt-2 whitespace-pre-wrap break-words text-base leading-7 text-ink">
                    {item.description}
                  </p>

                  <div
                    className={`mt-6 rounded-control border p-5 ${
                      isFound
                        ? "border-found/25 bg-found/5"
                        : "border-lost/25 bg-lost/5"
                    }`}
                  >
                    <p
                      className={`flex items-center gap-1.5 text-xs font-semibold ${
                        isFound ? "text-found" : "text-lost"
                      }`}
                    >
                      {isFound ? (
                        <FoundIcon size={14} aria-hidden="true" />
                      ) : (
                        <LostIcon size={14} aria-hidden="true" />
                      )}
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

              <div className="border-t border-line p-5 sm:p-6">
                {canManage && confirmingDelete ? (
                  <div
                    className="rounded-card border border-line bg-paper/50 p-5"
                    role="group"
                    aria-label="Confirm delete"
                  >
                    <p className="text-base font-semibold text-ink">
                      Delete this {statusLabel.toLowerCase()} item?
                    </p>
                    <p className="mt-1 text-sm leading-6 text-mute">
                      &ldquo;{displayName || "This item"}&rdquo; will be
                      removed from the{" "}
                      {statusLabel.toLowerCase()} items list. This cannot be
                      undone.
                    </p>
                    <div className="mt-5 flex flex-col-reverse items-stretch gap-3 sm:flex-row">
                      <Button
                        variant="secondary"
                        onClick={handleCancelDelete}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="dangerSolid"
                        onClick={handleConfirmDelete}
                      >
                        Yes, Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-between">
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
                        {adminModerating ? (
                          <p className="w-full text-sm leading-6 text-mute sm:w-auto">
                            Admin moderation: this report belongs to another
                            student.
                          </p>
                        ) : null}
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
              </div>
            </article>
          </Reveal>

          <PossibleMatches
            type={type}
            item={item}
            candidates={oppositeItems}
            candidatesLoading={oppositeLoading}
            candidatesLoadError={oppositeLoadError}
          />
        </>
      )}
    </div>
  );
}

export default ItemDetails;