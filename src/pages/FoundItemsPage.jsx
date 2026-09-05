import { useContext, useMemo, useState } from "react";
import { FoundItemContext } from "../context/FoundItemContext";
import PageShell from "../components/PageShell";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import { getItemTimestamp } from "../utils/items";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";

function FoundItemsPage() {
  const { foundItems, deleteFoundItem, updateFoundItem, isLoading, loadError } =
    useContext(FoundItemContext);

  const [search, setSearch] = useState(() => {
    const saved = sessionStorage.getItem("campusfind:found:search");
    if (saved) {
      sessionStorage.removeItem("campusfind:found:search");
      return saved;
    }
    return "";
  });
  const [category, setCategory] = useState(() => {
    const saved = sessionStorage.getItem("campusfind:found:category");
    if (saved) {
      sessionStorage.removeItem("campusfind:found:category");
      return saved;
    }
    return "All";
  });
  const [sort, setSort] = useState("newest");

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const next = foundItems.filter((item) => {
      const matchesSearch =
        !needle ||
        [item.itemName, item.category, item.location]
          .map((field) => (field || "").toLowerCase())
          .some((field) => field.includes(needle));

      const matchesCategory =
        category === "All" || item.category === category;

      return matchesSearch && matchesCategory;
    });

    next.sort((a, b) => {
      const diff =
        getItemTimestamp(a, "found") - getItemTimestamp(b, "found");
      return sort === "oldest" ? diff : -diff;
    });

    return next;
  }, [foundItems, search, category, sort]);

  const hasFilters =
    search.trim() !== "" || category !== "All";
  const showing = filteredItems.length;
  const total = foundItems.length;
  const countLabel = showing === 1 ? "item" : "items";
  const headerCount = hasFilters
    ? `${showing} of ${total} ${total === 1 ? "item" : "items"}`
    : `${total} ${total === 1 ? "item" : "items"}`;

  return (
    <PageShell
      title="Found Items"
      description="Check belongings that have been found on campus. Search by item name, category, or location to see if yours is listed."
      meta={headerCount}
      action={
        <Button to="/report-found" variant="save" className="w-full sm:w-auto">
          Report Found Item
        </Button>
      }
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
        searchLabel="Search found items"
        searchPlaceholder="Search by name, category, or location..."
      />

      {loadError && (
        <div
          className="mb-4 rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
          role="alert"
        >
          <p className="font-semibold">Found items unavailable</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      {isLoading ? (
        <div
          className="rounded-[8px] border border-line bg-surface px-5 py-10 text-center sm:px-8"
          role="status"
        >
          <p className="text-sm font-semibold text-mute">
            Loading found items…
          </p>
        </div>
      ) : showing === 0 ? (
        total === 0 ? (
          <EmptyState
            title="No found items have been reported yet"
            description="When someone turns in a found belonging, it will appear here so the owner can recognize it."
            actionLabel="Report Found Item"
            actionTo="/report-found"
            variant="save"
          />
        ) : (
          <EmptyState
            title="No found items found"
            description="Try changing your search or category, or report a found item."
            actionLabel="Report Found Item"
            actionTo="/report-found"
            variant="save"
          />
        )
      ) : (
        <>
          <p className="mb-4 text-sm text-mute" role="status">
            {hasFilters
              ? `Showing ${showing} of ${total} ${countLabel}`
              : `Showing ${showing} ${countLabel}`}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                type="found"
                item={item}
                onUpdate={updateFoundItem}
                onDelete={deleteFoundItem}
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

export default FoundItemsPage;
