import { useContext, useMemo, useState } from "react";
import { FoundItemContext } from "../context/FoundItemContext";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import PageShell from "../components/PageShell";
import { getItemTimestamp } from "../utils/items";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import LoadingState from "../components/LoadingState";
import Reveal from "../components/Reveal";

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

  const hasFilters = search.trim() !== "" || category !== "All";
  const showing = filteredItems.length;
  const total = foundItems.length;
  const statusText = hasFilters
    ? `Showing ${showing} of ${total} found ${total === 1 ? "item" : "items"}`
    : `${total} found ${total === 1 ? "item" : "items"} logged`;

  return (
    <PageShell
      title="Found Items Registry"
      badgeText="GCOEC Campus"
      description="Items turned in or located across college grounds. Search to see if your lost property has been found."
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
        searchPlaceholder="Search by title, department, or category..."
      />

      {loadError && (
        <div
          className="mb-6 rounded-card border border-found/30 bg-found-tint p-4 text-xs font-medium text-found"
          role="alert"
        >
          <p className="font-semibold text-sm">Found items unavailable</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading found items registry…" />
      ) : showing === 0 ? (
        total === 0 ? (
          <EmptyState
            title="No found items reported yet"
            description="When someone turns in a misplaced belonging, it will appear here for verification."
            actionLabel="Report Found Item"
            actionTo="/report-found"
            variant="found"
          />
        ) : (
          <EmptyState
            title="No items matched your search"
            description="Try adjusting your keywords or category filter, or file a report if you found something."
            actionLabel="Report Found Item"
            actionTo="/report-found"
            variant="found"
          />
        )
      ) : (
        <div className="min-w-0">
          <h2 className="sr-only">Found item listings</h2>
          <p
            className="mb-6 border-b border-line pb-3.5 text-sm font-medium text-ink/80"
            role="status"
          >
            {statusText}
          </p>
          <ul className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, index) => (
              <Reveal as="li" key={item.id} delay={Math.min(index, 5) * 50} className="min-w-0">
                <ItemCard
                  type="found"
                  item={item}
                  onUpdate={updateFoundItem}
                  onDelete={deleteFoundItem}
                />
              </Reveal>
            ))}
          </ul>
        </div>
      )}
    </PageShell>
  );
}

export default FoundItemsPage;
