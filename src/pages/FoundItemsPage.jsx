import { useContext, useMemo, useState } from "react";
import { FoundItemContext } from "../context/FoundItemContext";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import PageShell from "../components/PageShell";
import { getItemTimestamp } from "../utils/items";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import Reveal from "../components/Reveal";

const eyebrow = "GCOEC • Campus Lost & Found";

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
  const statusText = hasFilters
    ? `Showing ${showing} of ${total} found ${total === 1 ? "item" : "items"}`
    : `${total} found ${total === 1 ? "item" : "items"}`;

  return (
    <PageShell
      title="Found Items"
      eyebrow={eyebrow}
      description="Items reported as found across campus. Search by item name, category, or location to see if yours is listed."
      tone="found"
      action={
        <Button to="/report-found" variant="found" className="w-full sm:w-auto">
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
          className="mb-4 rounded-card border border-found/30 bg-found/10 p-4 text-sm text-found"
          role="alert"
        >
          <p className="font-semibold">Found items unavailable</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      {isLoading ? (
        <div
          className="rounded-card border border-line bg-surface px-5 py-10 text-center sm:px-8"
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
            variant="found"
          />
        ) : (
          <EmptyState
            title="No found items found"
            description="Try changing your search or category, or report a found item."
            actionLabel="Report Found Item"
            actionTo="/report-found"
            variant="found"
          />
        )
      ) : (
        <Reveal className="min-w-0">
          <div>
            <h2 className="sr-only">Found item listings</h2>
            <p className="mb-4 text-sm font-medium text-mute" role="status">
              {statusText}
            </p>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <li key={item.id} className="h-full min-w-0">
                  <ItemCard
                    type="found"
                    item={item}
                    onUpdate={updateFoundItem}
                    onDelete={deleteFoundItem}
                  />
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      )}
    </PageShell>
  );
}

export default FoundItemsPage;