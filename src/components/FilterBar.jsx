import { useId } from "react";

const CATEGORIES = [
  "All",
  "Electronics",
  "Accessories",
  "Books",
  "Documents",
  "Keys",
  "Other",
];

const controlClassName =
  "h-11 w-full min-w-0 rounded-[6px] border border-line bg-surface px-3 text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

function FilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  searchLabel = "Search items",
  searchPlaceholder = "Search items...",
  categoryLabel = "Category",
  sortLabel = "Sort",
}) {
  const searchId = useId();
  const categoryId = useId();
  const sortId = useId();

  return (
    <div className="mb-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="min-w-0 sm:col-span-2 lg:col-span-1">
        <label
          htmlFor={searchId}
          className="mb-2 block text-sm font-semibold text-ink"
        >
          {searchLabel}
        </label>
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={`${controlClassName} placeholder:text-mute`}
        />
      </div>

      <div className="min-w-0">
        <label
          htmlFor={categoryId}
          className="mb-2 block text-sm font-semibold text-ink"
        >
          {categoryLabel}
        </label>
        <select
          id={categoryId}
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={controlClassName}
        >
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All Categories" : option}
            </option>
          ))}
        </select>
      </div>

      {onSortChange ? (
        <div className="min-w-0">
          <label
            htmlFor={sortId}
            className="mb-2 block text-sm font-semibold text-ink"
          >
            {sortLabel}
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className={controlClassName}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      ) : null}
    </div>
  );
}

export default FilterBar;
