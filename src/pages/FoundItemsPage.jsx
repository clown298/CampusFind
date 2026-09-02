import { useContext, useMemo, useState } from "react";
import { FoundItemContext } from "../context/FoundItemContext";
import PageShell from "../components/PageShell";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import { getItemTimestamp } from "../utils/items";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";

function FoundItemsPage() {
  const { foundItems, deleteFoundItem, updateFoundItem } =
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
    const next = foundItems.filter((item) => {
      const itemName = item.itemName || item.item_name || "";

      const matchesSearch = itemName
        .toLowerCase()
        .includes(search.toLowerCase());

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
      description="Check belongings that have been found on campus. Search by name or filter by category to see if yours is listed."
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
        searchPlaceholder="Search found items..."
      />

      {showing === 0 ? (
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
