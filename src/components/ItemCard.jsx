import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import ItemImage from "./ItemImage";
import { AuthContext } from "../context/AuthContext";
import { formatDisplayDate, getItemDate, getItemName } from "../utils/items";
import { FoundIcon, LostIcon, PinIcon } from "./icons";

const fieldClass =
  "mt-2 h-11 w-full rounded-control border border-line bg-surface px-3 text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

function ItemCard({ type, item, onUpdate, onDelete }) {
  const { user } = useContext(AuthContext);
  const canManage = Boolean(
    user && item.userId && String(item.userId) === String(user.id)
  );

  const isFound = type === "found";
  const statusLabel = isFound ? "Found" : "Lost";
  const badgeClass = isFound
    ? "border-found text-found"
    : "border-lost text-lost";
  const hoverClass = isFound
    ? "hover:border-found/40"
    : "hover:border-lost/40";
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
      <article className="flex h-full min-w-0 flex-col rounded-card border border-line bg-surface p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-3"
        >
          <p className="text-sm font-semibold text-mute">Edit item</p>

          <label className="block text-sm font-semibold text-ink">
            Item name
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              maxLength={100}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "item-edit-error" : undefined}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-semibold text-ink">
            Category
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={50}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "item-edit-error" : undefined}
              className={fieldClass}
            />
          </label>

          {error && (
            <p
              id="item-edit-error"
              className="mt-3 rounded-control border border-lost/30 bg-lost/10 p-3 text-sm font-medium text-lost"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" variant="primary">Save</Button>
            <Button type="button" variant="secondary" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors duration-200 ${hoverClass}`}
    >
      <div className="flex-none">
        <ItemImage
          type={type}
          imageData={item.imageData}
          alt={`Photo of ${displayName}`}
          className="h-44 w-full sm:h-48"
          groupHover
          compact
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
          >
            {isFound ? (
              <FoundIcon size={14} aria-hidden="true" />
            ) : (
              <LostIcon size={14} aria-hidden="true" />
            )}
            {statusLabel}
          </span>
          <span className="shrink-0 text-xs font-medium text-mute">
            {displayDate}
          </span>
        </div>

        <h3 className="type-card mt-3 break-words text-lg text-ink">
          <Link
            to={detailsPath}
            className="-m-1 rounded-control p-1 underline-offset-4 no-underline transition-colors duration-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            aria-label={`View details: ${displayName}`}
          >
            {displayName}
          </Link>
        </h3>

        <p className="mt-1 break-words text-sm font-medium text-mute">
          {item.category}
        </p>

        <p className="mt-3 inline-flex min-w-0 items-center gap-1.5 text-sm text-mute">
          <PinIcon
            size={14}
            className="shrink-0 text-mute"
            aria-hidden="true"
          />
          <span className="min-w-0 break-words">{item.location}</span>
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button to={detailsPath} variant="secondary" className="w-full">
            View details
          </Button>
          {canManage ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={startEditing}>
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {confirmingDelete ? (
        <div
          className="border-t border-line bg-paper/50 px-5 py-4"
          role="group"
          aria-label="Confirm delete"
        >
          <p className="text-sm font-semibold text-ink">
            Delete this {statusLabel.toLowerCase()} item?
          </p>
          <p className="mt-1 text-sm text-mute">
            &ldquo;{displayName || "This item"}&rdquo; will be removed from the
            list. This cannot be undone.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="dangerSolid" onClick={handleConfirmDelete}>
              Delete
            </Button>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Cancel
            </Button>
          </div>
          {error && (
            <p className="mt-3 rounded-control border border-lost/30 bg-lost/10 p-3 text-sm font-medium text-lost">
              {error}
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}

export default ItemCard;