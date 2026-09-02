import { useContext, useMemo, useState } from "react";
import { LostItemContext } from "../context/LostItemContext";
import PageShell from "../components/PageShell";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import { getItemTimestamp } from "../utils/items";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";

function LostItemsPage() {
  const { lostItems, deleteLostItem, updateLostItem } =
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
    const next = lostItems.filter((item) => {
      const itemName = item.itemName || item.item_name || "";

      const matchesSearch = itemName
        .toLowerCase()
        .includes(search.toLowerCase());

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
  const countLabel = showing === 1 ? "item" : "items";
  const headerCount = hasFilters
    ? `${showing} of ${total} ${total === 1 ? "item" : "items"}`
    : `${total} ${total === 1 ? "item" : "items"}`;

  return (
    <PageShell
      title="Lost Items"
      description="Browse items students have reported missing on campus. Search by name or narrow the list by category."
      meta={headerCount}
      action={
        <Button to="/report-lost" variant="primary" className="w-full sm:w-auto">
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
        searchPlaceholder="Search lost items..."
      />

      {showing === 0 ? (
        total === 0 ? (
          <EmptyState
            title="No lost items have been reported yet"
            description="When someone reports a missing belonging, it will appear here for other students to check."
            actionLabel="Report Lost Item"
            actionTo="/report-lost"
            variant="primary"
          />
        ) : (
          <EmptyState
            title="No lost items found"
            description="Try changing your search or category, or report a lost item."
            actionLabel="Report Lost Item"
            actionTo="/report-lost"
            variant="primary"
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
                type="lost"
                item={item}
                onUpdate={updateLostItem}
                onDelete={deleteLostItem}
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

export default LostItemsPage;
