import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import { AuthContext } from "../context/AuthContext";
import { formatDisplayDate, getItemDate, getItemName } from "../utils/items";

function ItemCard({ type, item, onUpdate, onDelete }) {
  const { user } = useContext(AuthContext);
  const canManage = Boolean(
    user && item.userId && String(item.userId) === String(user.id)
  );

  const isFound = type === "found";
  const statusLabel = isFound ? "Found" : "Lost";
  const accentClass = isFound ? "text-canopy" : "text-brick";
  const badgeClass = isFound
    ? "border-canopy text-canopy"
    : "border-brick text-brick";
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

  return (
    <article className="min-w-0 rounded-[8px] border border-line bg-surface p-5">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-3"
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${accentClass}`}>
            {statusLabel}
          </p>

          <label className="block text-sm font-semibold text-ink">
            Item name
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="mt-2 h-11 w-full rounded-[6px] border border-line bg-paper px-3 text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            />
          </label>

          <label className="block text-sm font-semibold text-ink">
            Category
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 h-11 w-full rounded-[6px] border border-line bg-paper px-3 text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            />
          </label>

          {error && (
            <p className="mt-3 rounded-[4px] border border-lost/30 bg-lost/10 p-3 text-sm font-medium text-lost">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" variant="save">
              Save
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          {item.imageData && (
            <div className="mb-4 -mx-5 -mt-5 overflow-hidden rounded-t-[8px] border-b border-line bg-ink/5 aspect-[4/3]">
              <img
                src={item.imageData}
                alt=""
                className="h-full w-full object-cover"
              />
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

          <Link
            to={detailsPath}
            className={`mt-3 block break-words font-serif text-2xl font-semibold no-underline transition-colors duration-200 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-[4px] -m-1 p-1 ${accentClass}`}
            aria-label={`View details: ${displayName}`}
          >
            {displayName}
          </Link>

          <dl className="mt-4 space-y-2 break-words text-sm text-ink">
            <div>
              <dt className="inline font-semibold">Category: </dt>
              <dd className="inline">{item.category}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">
                {isFound ? "Location found: " : "Location: "}
              </dt>
              <dd className="inline">{item.location}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">
                {isFound ? "Date found: " : "Date lost: "}
              </dt>
              <dd className="inline">{displayDate}</dd>
            </div>
          </dl>

          {canManage ? (
            confirmingDelete ? (
              <div
                className="mt-5 rounded-[6px] border border-line bg-paper p-4"
                role="group"
                aria-label="Confirm delete"
              >
                <p className="text-sm font-semibold text-ink">
                  Delete this {statusLabel.toLowerCase()} item?
                </p>
                <p className="mt-1 text-sm text-mute">
                  "{displayName || "This item"}" will be removed from the list.
                  This cannot be undone.
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
                  <p className="mt-3 rounded-[4px] border border-lost/30 bg-lost/10 p-3 text-sm font-medium text-lost">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEditing(); }}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmingDelete(true); }}
                >
                  Delete
                </Button>
              </div>
            )
          ) : null}
        </>
      )}
    </article>
  );
}

export default ItemCard;
