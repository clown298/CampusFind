import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LostItemContext } from "../context/LostItemContext";
import { FoundItemContext } from "../context/FoundItemContext";
import Button from "../components/Button";
import ItemCard from "../components/ItemCard";
import EmptyState from "../components/EmptyState";
import { getItemTimestamp } from "../utils/items";

const CATEGORIES = [
  "Electronics",
  "Accessories",
  "Books",
  "Documents",
  "Keys",
  "Other",
];

function SearchIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function Home() {
  const {
    lostItems,
    deleteLostItem,
    updateLostItem,
    isLoading: lostLoading,
    loadError: lostLoadError,
  } = useContext(LostItemContext);
  const {
    foundItems,
    deleteFoundItem,
    updateFoundItem,
    isLoading: foundLoading,
    loadError: foundLoadError,
  } = useContext(FoundItemContext);
  const navigate = useNavigate();

  const [heroSearch, setHeroSearch] = useState("");

  const recentLost = useMemo(() => {
    const sorted = [...lostItems].sort((a, b) => {
      return getItemTimestamp(b, "lost") - getItemTimestamp(a, "lost");
    });
    return sorted.slice(0, 3);
  }, [lostItems]);

  const recentFound = useMemo(() => {
    const sorted = [...foundItems].sort((a, b) => {
      return getItemTimestamp(b, "found") - getItemTimestamp(a, "found");
    });
    return sorted.slice(0, 3);
  }, [foundItems]);

  function goToLostSearch() {
    if (heroSearch.trim()) {
      sessionStorage.setItem("campusfind:lost:search", heroSearch.trim());
    }
    navigate("/lost-items");
  }

  function goToFoundSearch() {
    if (heroSearch.trim()) {
      sessionStorage.setItem("campusfind:found:search", heroSearch.trim());
    }
    navigate("/found-items");
  }

  function handleHeroKeyDown(e) {
    if (e.key === "Enter") {
      goToLostSearch();
    }
  }

  function goToLostCategory(cat) {
    sessionStorage.setItem("campusfind:lost:category", cat);
    navigate("/lost-items");
  }

  function goToFoundCategory(cat) {
    sessionStorage.setItem("campusfind:found:category", cat);
    navigate("/found-items");
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-clip px-4 py-10 sm:px-6">
      {(lostLoadError || foundLoadError) && (
        <div
          className="mb-6 rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
          role="alert"
        >
          <p className="font-semibold">Some listings could not be loaded</p>
          <p className="mt-1">
            {lostLoadError ? `${lostLoadError} ` : ""}
            {foundLoadError ? ` ${foundLoadError}` : ""}
          </p>
        </div>
      )}

      {/* 1. Hero + Search */}
      <section className="border-b border-line pb-10 sm:pb-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center rounded-[999px] border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-mute">
            GCOEC Chandrapur
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl md:text-6xl">
            <span className="block">Find what you lost.</span>
            <span className="mt-1 block text-mute">Return what you found.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-mute sm:text-lg">
            A simple campus lost-and-found service for GCOEC Chandrapur
            students.
          </p>

          <div className="mt-8">
            <div className="flex min-h-[52px] flex-col items-stretch gap-2 rounded-[8px] border border-line bg-surface p-2 sm:flex-row sm:items-center sm:gap-2">
              <div className="flex flex-1 items-center min-w-0 px-2">
                <SearchIcon className="mr-2 h-5 w-5 shrink-0 text-mute" />
                <input
                  type="search"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  onKeyDown={handleHeroKeyDown}
                  placeholder="Search for an item, category, or location..."
                  aria-label="Search lost and found items"
                  className="h-11 w-full min-w-0 border-0 bg-transparent px-1 py-2 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus:ring-0"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="primary"
                  onClick={goToLostSearch}
                  className="flex-1 sm:flex-none"
                >
                  Search Lost Items
                </Button>
                <Button
                  type="button"
                  variant="save"
                  onClick={goToFoundSearch}
                  className="flex-1 sm:flex-none"
                >
                  Search Found Items
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Report Quick Actions */}
      <section className="py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          <div className="rounded-[8px] border border-line bg-surface p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brick">
              Report Lost
            </p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink">
              Report a Lost Item
            </h2>
            <p className="mt-2 text-base leading-6 text-mute">
              Lost something on campus? Report it so others can help.
            </p>
            <div className="mt-6">
              <Button
                to="/report-lost"
                variant="primary"
                className="w-full sm:w-auto"
              >
                Report Lost Item
              </Button>
            </div>
          </div>

          <div className="rounded-[8px] border border-line bg-surface p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-canopy">
              Report Found
            </p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink">
              Report a Found Item
            </h2>
            <p className="mt-2 text-base leading-6 text-mute">
              Found something on campus? Help return it to its owner.
            </p>
            <div className="mt-6">
              <Button
                to="/report-found"
                variant="save"
                className="w-full sm:w-auto"
              >
                Report Found Item
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Browse by Category */}
      <section className="border-t border-line pt-10 sm:pt-14">
        <div className="mb-6">
          <h2 className="font-serif text-3xl font-semibold text-ink">
            Browse by category
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-6 text-mute">
            Narrow the listings using the same categories used across lost and
            found reports.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="rounded-[8px] border border-line bg-surface p-4"
            >
              <p className="font-serif text-lg font-semibold text-ink">
                {cat}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => goToLostCategory(cat)}
                  className="inline-flex min-h-[40px] items-center justify-between rounded-[6px] border border-line px-3 py-1.5 text-xs font-semibold text-brick transition-colors duration-200 hover:border-brick/50 hover:bg-brick/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  <span>Lost</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => goToFoundCategory(cat)}
                  className="inline-flex min-h-[40px] items-center justify-between rounded-[6px] border border-line px-3 py-1.5 text-xs font-semibold text-canopy transition-colors duration-200 hover:border-canopy/50 hover:bg-canopy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  <span>Found</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Recently Lost / Recently Found */}
      <section className="border-t border-line py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-8">
          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  Recently Lost
                </h2>
                <p className="mt-1 text-sm text-mute">
                  {lostItems.length === 0
                    ? "No items reported yet."
                    : lostItems.length === 1
                    ? "1 item reported."
                    : `${lostItems.length} items reported.`}
                </p>
              </div>
              <Button
                to="/lost-items"
                variant="secondary"
                className="shrink-0"
              >
                <span className="flex items-center gap-1.5">
                  View all
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </Button>
            </div>

            {lostLoading ? (
              <div
                className="rounded-[8px] border border-line bg-surface px-5 py-10 text-center"
                role="status"
              >
                <p className="text-sm font-semibold text-mute">
                  Loading recent lost items…
                </p>
              </div>
            ) : recentLost.length === 0 ? (
              <EmptyState
                title="No lost items yet"
                description="Items reported missing will appear here for other students to check."
                actionLabel="Report Lost Item"
                actionTo="/report-lost"
                variant="primary"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {recentLost.map((item) => (
                  <ItemCard
                    key={item.id}
                    type="lost"
                    item={item}
                    onUpdate={updateLostItem}
                    onDelete={deleteLostItem}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  Recently Found
                </h2>
                <p className="mt-1 text-sm text-mute">
                  {foundItems.length === 0
                    ? "No items turned in yet."
                    : foundItems.length === 1
                    ? "1 item turned in."
                    : `${foundItems.length} items turned in.`}
                </p>
              </div>
              <Button
                to="/found-items"
                variant="secondary"
                className="shrink-0"
              >
                <span className="flex items-center gap-1.5">
                  View all
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </Button>
            </div>

            {foundLoading ? (
              <div
                className="rounded-[8px] border border-line bg-surface px-5 py-10 text-center"
                role="status"
              >
                <p className="text-sm font-semibold text-mute">
                  Loading recent found items…
                </p>
              </div>
            ) : recentFound.length === 0 ? (
              <EmptyState
                title="No found items yet"
                description="Items turned in will appear here so owners can identify them."
                actionLabel="Report Found Item"
                actionTo="/report-found"
                variant="save"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {recentFound.map((item) => (
                  <ItemCard
                    key={item.id}
                    type="found"
                    item={item}
                    onUpdate={updateFoundItem}
                    onDelete={deleteFoundItem}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="border-t border-line pt-10 sm:pt-14">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-semibold text-ink">
              How it works
            </h2>
            <p className="mt-2 text-base leading-6 text-mute">
              Three simple steps between losing something and getting it back.
            </p>
          </div>

          <ol className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-4">
            <li className="rounded-[8px] border border-line bg-surface p-6">
              <p className="font-serif text-3xl font-semibold text-brick">01</p>
              <h3 className="mt-2 text-lg font-semibold uppercase tracking-[0.06em] text-ink">
                Search
              </h3>
              <p className="mt-2 text-sm leading-6 text-mute">
                Look through reported lost and found items by name, category,
                or location.
              </p>
            </li>
            <li className="rounded-[8px] border border-line bg-surface p-6">
              <p className="font-serif text-3xl font-semibold text-brick">02</p>
              <h3 className="mt-2 text-lg font-semibold uppercase tracking-[0.06em] text-ink">
                Report
              </h3>
              <p className="mt-2 text-sm leading-6 text-mute">
                Post an item you lost or found on campus so the campus
                community can see it.
              </p>
            </li>
            <li className="rounded-[8px] border border-line bg-surface p-6">
              <p className="font-serif text-3xl font-semibold text-brick">03</p>
              <h3 className="mt-2 text-lg font-semibold uppercase tracking-[0.06em] text-ink">
                Connect
              </h3>
              <p className="mt-2 text-sm leading-6 text-mute">
                Use contact details from each report to arrange a safe return
                on campus.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="border-t border-line py-10 sm:py-14">
        <div className="mx-auto max-w-3xl rounded-[8px] border border-line bg-surface px-6 py-8 sm:px-10 sm:py-10">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-semibold text-ink">
              Have something to report?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-base leading-6 text-mute">
              Your report could help a classmate get their belongings back.
            </p>
          </div>
          <div className="mt-6 flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              to="/report-lost"
              variant="primary"
              className="w-full sm:w-auto"
            >
              Report Lost Item
            </Button>
            <Button
              to="/report-found"
              variant="save"
              className="w-full sm:w-auto"
            >
              Report Found Item
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
