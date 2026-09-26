import { useContext, useMemo, useState } from "react";
import { LostItemContext } from "../context/LostItemContext";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import PageShell from "../components/PageShell";
import { getItemTimestamp } from "../utils/items";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import Reveal from "../components/Reveal";

const eyebrow = "GCOEC • Campus Lost & Found";

function LostItemsPage() {
  const { lostItems, deleteLostItem, updateLostItem, isLoading, loadError } =
    useContext(LostItemContext);

  const [search, setSearch] = useState(() => {
    const saved = sessionStorage.getItem("campusfind:lost:search");
    if (saved) {
      sessionStorage.removeItem("campusfind:lost:search");
      return saved;
    }
    return "";
  });
  const [category, setCategory] = useState(() => {
    const saved = sessionStorage.getItem("campusfind:lost:category");
    if (saved) {
      sessionStorage.removeItem("campusfind:lost:category");
      return saved;
    }
    return "All";
  });
  const [sort, setSort] = useState("newest");

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const next = lostItems.filter((item) => {
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
      const diff = getItemTimestamp(a, "lost") - getItemTimestamp(b, "lost");
      return sort === "oldest" ? diff : -diff;
    });

    return next;
  }, [lostItems, search, category, sort]);

  const hasFilters =
    search.trim() !== "" || category !== "All";
  const showing = filteredItems.length;
  const total = lostItems.length;
  const statusText = hasFilters
    ? `Showing ${showing} of ${total} lost ${total === 1 ? "item" : "items"}`
    : `${total} lost ${total === 1 ? "item" : "items"}`;

  return (
    <PageShell
      title="Lost Items"
      eyebrow={eyebrow}
      description="Items reported missing across campus. Search by item name, category, or location."
      tone="lost"
      action={
        <Button to="/report-lost" variant="lost" className="w-full sm:w-auto">
          Report Lost Item
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
        searchLabel="Search lost items"
        searchPlaceholder="Search by name, category, or location..."
      />

      {loadError && (
        <div
          className="mb-4 rounded-card border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
          role="alert"
        >
          <p className="font-semibold">Lost items unavailable</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      {isLoading ? (
        <div
          className="rounded-card border border-line bg-surface px-5 py-10 text-center sm:px-8"
          role="status"
        >
          <p className="text-sm font-semibold text-mute">
            Loading lost items…
          </p>
        </div>
      ) : showing === 0 ? (
        total === 0 ? (
          <EmptyState
            title="No lost items have been reported yet"
            description="When someone reports a missing belonging, it will appear here for other students to check."
            actionLabel="Report Lost Item"
            actionTo="/report-lost"
            variant="lost"
          />
        ) : (
          <EmptyState
            title="No lost items found"
            description="Try changing your search or category, or report a lost item."
            actionLabel="Report Lost Item"
            actionTo="/report-lost"
            variant="lost"
          />
        )
      ) : (
        <Reveal className="min-w-0">
          <div>
            <h2 className="sr-only">Lost item listings</h2>
            <p className="mb-4 text-sm font-medium text-mute" role="status">
              {statusText}
            </p>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <li key={item.id} className="h-full min-w-0">
                  <ItemCard
                    type="lost"
                    item={item}
                    onUpdate={updateLostItem}
                    onDelete={deleteLostItem}
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

export default LostItemsPage;