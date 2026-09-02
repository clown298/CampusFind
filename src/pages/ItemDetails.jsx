import { useContext, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LostItemContext } from "../context/LostItemContext";
import { FoundItemContext } from "../context/FoundItemContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { formatDisplayDate, getItemName, getItemDate } from "../utils/items";

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

  const lostCtx = useContext(LostItemContext);
  const foundCtx = useContext(FoundItemContext);

  const items = isFound ? foundCtx.foundItems : lostCtx.lostItems;
  const deleteItem = isFound ? foundCtx.deleteFoundItem : lostCtx.deleteLostItem;
  const updateItem = isFound
    ? foundCtx.updateFoundItem
    : lostCtx.updateLostItem;

  const item = useMemo(() => {
    const found = items.find((i) => String(i.id) === String(id));
    return found || null;
  }, [items, id]);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errors, setErrors] = useState({});

  const [itemName, setItemName] = useState(item ? getItemName(item) : "");
  const [category, setCategory] = useState(item?.category || "");
  const [description, setDescription] = useState(item?.description || "");
  const [location, setLocation] = useState(item?.location || "");
  const [dateField, setDateField] = useState(
    item ? (item.dateFound || item.dateLost || item.date_found || item.date_lost || "") : ""
  );
  const [contact, setContact] = useState(item?.contact || "");

  function startEditing() {
    if (!item) return;
    setConfirmingDelete(false);
    setItemName(getItemName(item));
    setCategory(item.category || "");
    setDescription(item.description || "");
    setLocation(item.location || "");
    setDateField(
      item.dateFound ||
        item.dateLost ||
        item.date_found ||
        item.date_lost ||
        ""
    );
    setContact(item.contact || "");
    setErrors({});
    setEditing(true);
  }

  function handleCancelEdit() {
    if (!item) return;
    setItemName(getItemName(item));
    setCategory(item.category || "");
    setDescription(item.description || "");
    setLocation(item.location || "");
    setDateField(
      item.dateFound ||
        item.dateLost ||
        item.date_found ||
        item.date_lost ||
        ""
    );
    setContact(item.contact || "");
    setErrors({});
    setEditing(false);
  }

  function handleSave(e) {
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
    };

    updateItem(updatedItem);
    setEditing(false);
  }

  function handleCancelDelete() {
    setConfirmingDelete(false);
  }

  function handleConfirmDelete() {
    if (!item) return;
    deleteItem(item.id);
    setConfirmingDelete(false);
    navigate(listPath);
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
      </div>
    </PageShell>
  );
}

export default ItemDetails;
