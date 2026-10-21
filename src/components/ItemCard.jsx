import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import ItemImage from "./ItemImage";
import { AuthContext } from "../context/AuthContext";
import { formatDisplayDate, getItemDate, getItemName } from "../utils/items";
import { CalendarIcon, FoundIcon, LostIcon, PinIcon } from "./icons";
import { inputClass } from "./fieldStyles";

function ItemCard({ type, item, onUpdate, onDelete, variant = "grid" }) {
  const { user, isAdmin } = useContext(AuthContext);
  const isOwner = Boolean(
    user && item.userId && String(item.userId) === String(user.id)
  );
  const canManage = isOwner || isAdmin;

  const isFound = type === "found";
  const statusLabel = isFound ? "Found" : "Lost";
  const detailsPath = isFound
    ? `/found-items/${item.id}`
    : `/lost-items/${item.id}`;

  const displayName = getItemName(item);
  const displayDate = formatDisplayDate(getItemDate(item, type));

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [itemName, setItemName] = useState(displayName);
  const [category, setCategory] = useState(item.category || "");
  const [error, setError] = useState(null);

  function startEditing() {
    setConfirmingDelete(false);
    setError(null);
    setItemName(getItemName(item));
    setCategory(item.category || "");
    setEditing(true);
  }

  async function handleSave() {
    setError(null);
    try {
      await onUpdate({
        ...item,
        itemName,
        category,
      });
      setEditing(false);
    } catch (err) {
      console.error("Error updating item:", err);
      setError(
        (err && err.message) || "Could not update the item. Please try again."
      );
    }
  }

  function handleCancelEdit() {
    setError(null);
    setItemName(getItemName(item));
    setCategory(item.category || "");
    setEditing(false);
  }

  function handleCancelDelete() {
    setError(null);
    setConfirmingDelete(false);
  }

  async function handleConfirmDelete() {
    setError(null);
    try {
      await onDelete(item.id);
      setConfirmingDelete(false);
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(
        (err && err.message) || "Could not delete the item. Please try again."
      );
      setConfirmingDelete(false);
    }
  }

  if (editing) {
    return (
      <article
        className={`min-w-0 rounded-card border border-line bg-surface p-5 shadow-sm ${
          variant === "row" ? "w-full" : "flex h-full flex-col"
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <h3 className="text-sm font-semibold text-ink">Edit Item Details</h3>
            <span className="text-xs font-medium text-mute">{statusLabel}</span>
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wider text-mute">
            Item name
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className={`mt-1.5 ${inputClass(false)}`}
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-mute">
            Category
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`mt-1.5 ${inputClass(false)}`}
            />
          </label>

          {error && (
            <p
              id="item-edit-error"
              className="mt-3 rounded-control border border-lost/30 bg-lost-tint p-3 text-xs font-medium text-lost animate-alert-in"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button type="submit" variant="primary" size="sm">
              Save changes
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      </article>
    );
  }

  if (variant === "row") {
    return (
      <article
        className={`group min-w-0 rounded-card border border-line bg-surface transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:shadow-black/5 ${
          isFound ? "hover:border-found/40" : "hover:border-lost/40"
        }`}
      >
        <div className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
          <ItemImage
            type={type}
            imageData={item.imageData}
            alt={`Photo of ${displayName}`}
            className="aspect-[4/3] w-full shrink-0 rounded-control border border-line sm:w-36"
            groupHover
            compact
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  isFound
                    ? "border-found/30 bg-found/10 text-found"
                    : "border-lost/30 bg-lost/10 text-lost"
                }`}
              >
                {isFound ? (
                  <FoundIcon size={12} aria-hidden="true" />
                ) : (
                  <LostIcon size={12} aria-hidden="true" />
                )}
                {statusLabel}
              </span>
              <span className="text-xs font-medium text-mute">
                {item.category}
              </span>
            </div>

            <h3 className="type-card mt-2 break-words text-lg text-ink group-hover:text-primary transition-colors">
              <Link
                to={detailsPath}
                className="-m-1 rounded-control p-1 outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                aria-label={`View details: ${displayName}`}
              >
                {displayName}
              </Link>
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <PinIcon
                  size={13}
                  className="shrink-0 text-mute/80"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{item.location}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon
                  size={13}
                  className="shrink-0 text-mute/80"
                  aria-hidden="true"
                />
                {displayDate}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              to={detailsPath}
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
            >
              View details
            </Button>
            {canManage ? (
              <>
                <Button variant="secondary" size="sm" onClick={startEditing}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {confirmingDelete ? (
          <div
            className="border-t border-line bg-paper/60 px-5 py-4"
            role="group"
            aria-label="Confirm delete"
          >
            <p className="text-sm font-semibold text-ink">
              Delete this {statusLabel.toLowerCase()} item?
            </p>
            <p className="mt-1 text-xs text-mute">
              &ldquo;{displayName || "This item"}&rdquo; will be permanently removed.
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <Button variant="dangerSolid" size="sm" onClick={handleConfirmDelete}>
                Confirm Delete
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCancelDelete}>
                Cancel
              </Button>
            </div>
            {error && (
              <p className="mt-3 rounded-control border border-lost/30 bg-lost-tint p-3 text-xs font-medium text-lost animate-alert-in">
                {error}
              </p>
            )}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:shadow-black/5 ${
        isFound ? "hover:border-found/40" : "hover:border-lost/40"
      }`}
    >
      <div className="flex-none">
        <ItemImage
          type={type}
          imageData={item.imageData}
          alt={`Photo of ${displayName}`}
          className="aspect-[4/3] w-full border-b border-line"
          groupHover
          compact
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              isFound
                ? "border-found/30 bg-found/10 text-found"
                : "border-lost/30 bg-lost/10 text-lost"
            }`}
          >
            {isFound ? (
              <FoundIcon size={12} aria-hidden="true" />
            ) : (
              <LostIcon size={12} aria-hidden="true" />
            )}
            {statusLabel}
          </span>
          <span className="shrink-0 text-xs font-medium text-mute/80">
            {displayDate}
          </span>
        </div>

        <h3 className="type-card mt-3 break-words text-lg text-ink group-hover:text-primary transition-colors">
          <Link
            to={detailsPath}
            className="-m-1 rounded-control p-1 outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            aria-label={`View details: ${displayName}`}
          >
            {displayName}
          </Link>
        </h3>

        <p className="mt-1 break-words text-xs font-medium text-mute">
          {item.category}
        </p>

        <p className="mt-3 inline-flex min-w-0 items-center gap-1.5 text-xs text-mute">
          <PinIcon
            size={13}
            className="shrink-0 text-mute/80"
            aria-hidden="true"
          />
          <span className="min-w-0 break-words">{item.location}</span>
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-line/60">
          {canManage ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={startEditing}>
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </Button>
            </div>
          ) : null}
          <Button to={detailsPath} variant="primary" size="sm" className="w-full">
            View details
          </Button>
        </div>
      </div>

      {confirmingDelete ? (
        <div
          className="border-t border-line bg-paper/60 px-5 py-4"
          role="group"
          aria-label="Confirm delete"
        >
          <p className="text-sm font-semibold text-ink">
            Delete this {statusLabel.toLowerCase()} item?
          </p>
          <p className="mt-1 text-xs text-mute">
            &ldquo;{displayName || "This item"}&rdquo; will be permanently removed.
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <Button variant="dangerSolid" size="sm" onClick={handleConfirmDelete}>
              Confirm Delete
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCancelDelete}>
              Cancel
            </Button>
          </div>
          {error && (
            <p className="mt-3 rounded-control border border-lost/30 bg-lost-tint p-3 text-xs font-medium text-lost animate-alert-in">
              {error}
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}

export default ItemCard;
