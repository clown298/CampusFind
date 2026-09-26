import { useId } from "react";
import { SearchIcon } from "./icons";

const CATEGORIES = [
  "All",
  "Electronics",
  "Accessories",
  "Books",
  "Documents",
  "Keys",
  "Other",
];

const selectClassName =
  "h-11 w-full min-w-0 cursor-pointer rounded-control border border-line bg-surface px-3 text-sm text-ink transition-colors duration-150 hover:border-mute/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const searchClassName =
  "h-11 w-full min-w-0 rounded-control border border-line bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-mute/70 transition-colors duration-150 hover:border-mute/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

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
    <div className="mb-6 grid min-w-0 grid-cols-1 gap-3 rounded-card border border-line/80 bg-surface p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
      <div className="relative min-w-0">
        <span
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5"
          aria-hidden="true"
        >
          <SearchIcon size={18} className="text-mute" />
        </span>
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
          className={searchClassName}
        />
      </div>

      <div className="min-w-0">
        <select
          id={categoryId}
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label={categoryLabel}
          className={selectClassName}
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
          <select
            id={sortId}
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label={sortLabel}
            className={selectClassName}
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