import { useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LostItemContext } from "../context/LostItemContext";
import { FoundItemContext } from "../context/FoundItemContext";
import { RecoveryRequestContext } from "../context/RecoveryRequestContext";
import { useDocumentTitle } from "../utils/seo";
import { getItemDate, getItemName, formatDisplayDate } from "../utils/items";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import StatusChip from "../components/StatusChip";
import {
  SearchIcon,
  ArrowRightIcon,
  LostIcon,
  FoundIcon,
  ReportIcon,
  MatchIcon,
  VerifyIcon,
  RecoverIcon,
  CampusIcon,
  ShieldIcon,
  PinIcon,
  CalendarIcon,
} from "../components/icons";

const SCOPES = [
  { value: "all", label: "All" },
  { value: "lost", label: "Lost" },
  { value: "found", label: "Found" },
];

const SCOPE_ACTIVE = {
  all: "bg-surface text-ink shadow-sm font-semibold",
  lost: "bg-lost/10 text-lost font-semibold",
  found: "bg-found/10 text-found font-semibold",
};

const RECOVERY_STEPS = [
  {
    icon: ReportIcon,
    title: "1. Report",
    description:
      "Submit details, category, location, date, and an optional photo so campus members can identify the belonging.",
  },
  {
    icon: MatchIcon,
    title: "2. Match",
    description:
      "Rule-based matching compares reports using item name, category, location, and date proximity to find possible pairs.",
  },
  {
    icon: VerifyIcon,
    title: "3. Verify",
    description:
      "Submit a recovery request with proof of ownership for campus administrator review before property changes hands.",
  },
  {
    icon: RecoverIcon,
    title: "4. Recover",
    description:
      "Once approved by the campus administrator, coordinate the return and mark the listing as recovered.",
  },
];

const CAMPUS_PRINCIPLES = [
  {
    icon: CampusIcon,
    title: "GCOEC Campus Focused",
    description:
      "Designed specifically for students, faculty, and staff across the Government College of Engineering, Chandrapur campus.",
  },
  {
    icon: ReportIcon,
    title: "Detailed Property Records",
    description:
      "Every report captures item category, campus location, date, and contact details to assist in proper identification.",
  },
  {
    icon: ShieldIcon,
    title: "Administrative Verification",
    description:
      "Recovery requests require administrator review to ensure belongings are returned to their verified rightful owners.",
  },
  {
    icon: MatchIcon,
    title: "Rule-Based Matching",
    description:
      "Deterministic similarity scoring compares lost and found listings to highlight potential matching candidates.",
  },
];

const containerClass = "mx-auto w-full min-w-0 max-w-[1440px] px-4 sm:px-8";

function HeroSearch({
  query,
  setQuery,
  scope,
  setScope,
  handleSearch,
  handleSearchKeyDown,
}) {
  return (
    <div className="w-full rounded-card border border-line bg-surface p-4 shadow-sm shadow-black/5 sm:p-5">
      <div
        role="group"
        aria-label="Choose search scope"
        className="flex items-center gap-1 rounded-control bg-paper p-1"
      >
        {SCOPES.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={scope === s.value}
            onClick={() => setScope(s.value)}
            className={[
              "min-h-[38px] flex-1 cursor-pointer rounded-control px-3 text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
              scope === s.value
                ? SCOPE_ACTIVE[s.value]
                : "text-mute hover:text-ink",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex min-h-[46px] items-center gap-2 rounded-control border border-line bg-surface px-3.5 transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <SearchIcon className="h-4 w-4 shrink-0 text-mute" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search items by name, category, or location..."
          aria-label="Search lost and found items"
          className="h-10 w-full min-w-0 flex-1 border-0 bg-transparent text-sm text-ink placeholder:text-mute/70 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="inline-flex min-h-[36px] shrink-0 cursor-pointer items-center justify-center rounded-control bg-primary px-4 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Search
        </button>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-2 pt-1 text-xs text-mute">
        <span className="font-medium text-ink/70">Popular campus categories:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {["Electronics", "Keys", "Documents", "Books"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setQuery(cat)}
              className="inline-flex min-h-[28px] cursor-pointer items-center rounded-control bg-paper px-2.5 py-1 text-xs font-medium text-ink/80 transition-colors duration-150 hover:bg-frost hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentItemRow({ item, kind, status }) {
  const isFound = kind === "found";
  const displayName = getItemName(item);
  const displayDate = formatDisplayDate(getItemDate(item, kind));
  const linkPath = isFound
    ? `/found-items/${item.id}`
    : `/lost-items/${item.id}`;

  const statusMeta = {
    Open: { chip: "border-line bg-paper text-mute", dot: "bg-mute" },
    "In Recovery": {
      chip: "border-pending/30 bg-pending/10 text-pending",
      dot: "bg-pending",
    },
  };
  const currentMeta = statusMeta[status] || statusMeta.Open;

  return (
    <Link
      to={linkPath}
      className={`group flex items-start justify-between gap-3 rounded-control border border-line bg-surface p-3.5 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:shadow-black/5 ${
        isFound
          ? "hover:border-found/40 hover:bg-found-tint/30"
          : "hover:border-lost/40 hover:bg-lost-tint/30"
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-mute">
            {item.category || "General"}
          </span>
          {status === "In Recovery" && (
            <StatusChip
              label="In Recovery"
              classes={currentMeta.chip}
              dot={currentMeta.dot}
            />
          )}
        </div>
        <h4 className="type-card mt-1 truncate text-base font-medium text-ink group-hover:text-primary transition-colors">
          {displayName}
        </h4>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
          <span className="inline-flex items-center gap-1">
            <PinIcon size={12} className="shrink-0 text-mute" />
            <span className="truncate">{item.location}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarIcon size={12} className="shrink-0 text-mute" />
            <span>{displayDate}</span>
          </span>
        </div>
      </div>
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-line text-mute transition-[border-color,color,transform] duration-150 group-hover:border-primary group-hover:text-primary group-hover:translate-x-0.5">
        <ArrowRightIcon size={14} />
      </span>
    </Link>
  );
}

function Home() {
  useDocumentTitle("Campus Lost & Found");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");

  const { lostItems, isLoading: lostLoading, loadError: lostError } =
    useContext(LostItemContext);
  const { foundItems, isLoading: foundLoading, loadError: foundError } =
    useContext(FoundItemContext);
  const { recoveryRequests } = useContext(RecoveryRequestContext);

  function handleSearch() {
    const targetScope = scope === "found" ? "found" : "lost";
    const key = `campusfind:${targetScope}:search`;
    if (query.trim()) {
      sessionStorage.setItem(key, query.trim());
    }
    navigate(`/${targetScope}-items`);
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  const activeLost = useMemo(() => {
    const requests = recoveryRequests || [];
    const recoveredIds = new Set(
      requests
        .filter((r) => r.status === "recovered")
        .map((r) => String(r.lostItemId))
    );
    const inRecoveryIds = new Set(
      requests
        .filter((r) => r.status === "pending" || r.status === "approved")
        .map((r) => String(r.lostItemId))
    );

    return lostItems
      .filter((item) => !recoveredIds.has(String(item.id)))
      .slice(0, 3)
      .map((item) => ({
        ...item,
        status: inRecoveryIds.has(String(item.id)) ? "In Recovery" : "Open",
      }));
  }, [lostItems, recoveryRequests]);

  const activeFound = useMemo(() => {
    const requests = recoveryRequests || [];
    const recoveredIds = new Set(
      requests
        .filter((r) => r.status === "recovered")
        .map((r) => String(r.foundItemId))
    );
    const inRecoveryIds = new Set(
      requests
        .filter((r) => r.status === "pending" || r.status === "approved")
        .map((r) => String(r.foundItemId))
    );

    return foundItems
      .filter((item) => !recoveredIds.has(String(item.id)))
      .slice(0, 3)
      .map((item) => ({
        ...item,
        status: inRecoveryIds.has(String(item.id)) ? "In Recovery" : "Open",
      }));
  }, [foundItems, recoveryRequests]);

  return (
    <div className="w-full min-w-0 overflow-x-clip bg-paper">
      {/* 1. Main Entry — Warm Editorial Hero */}
      <section
        className="border-b border-line bg-paper py-12 sm:py-16 lg:py-20"
        aria-labelledby="hero-heading"
      >
        <div className={containerClass}>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="min-w-0 lg:col-span-7">
              <p style={{ animationDelay: "0ms" }} className="hero-rise inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-mute">
                <span
                  className="h-2 w-2 rounded-full bg-primary"
                  aria-hidden="true"
                />
                GCOEC • Campus Lost &amp; Found
              </p>

              <h1
                id="hero-heading"
                style={{ animationDelay: "80ms" }}
                className="hero-rise type-display mt-5 text-5xl font-bold text-ink sm:text-6xl md:text-7xl lg:text-[5.25rem] xl:text-[6.25rem] leading-[1.02] tracking-tight"
              >
                CampusFind
              </h1>

              <p
                style={{ animationDelay: "140ms" }}
                className="hero-rise type-title mt-3.5 text-xl font-bold text-ink sm:text-2xl lg:text-[1.65rem] leading-snug tracking-tight"
              >
                Report, match, and recover lost belongings on campus.
              </p>

              <p style={{ animationDelay: "200ms" }} className="hero-rise mt-3.5 max-w-2xl text-base leading-7 text-mute sm:text-lg">
                CampusFind is a campus lost-and-found platform for Government College of
                Engineering, Chandrapur. Report what you misplaced, browse turned-in
                belongings, and request recovery through the admin review process.
              </p>

              {/* Immediate Primary Actions */}
              <div style={{ animationDelay: "240ms" }} className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  to="/report-lost"
                  variant="lost"
                  className="w-full gap-2 sm:w-auto"
                >
                  <ReportIcon size={16} />
                  Report a Lost Item
                </Button>
                <Button
                  to="/report-found"
                  variant="found"
                  className="w-full gap-2 sm:w-auto"
                >
                  <FoundIcon size={16} />
                  Report a Found Item
                </Button>
                <Button
                  to="/lost-items"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Browse Listings
                </Button>
              </div>
            </div>

            {/* Search Box Deck */}
            <div style={{ animationDelay: "120ms" }} className="hero-rise min-w-0 lg:col-span-5">
              <HeroSearch
                query={query}
                setQuery={setQuery}
                scope={scope}
                setScope={setScope}
                handleSearch={handleSearch}
                handleSearchKeyDown={handleSearchKeyDown}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Recent Campus Listings */}
      <section
        className="border-b border-line bg-surface py-12 sm:py-16"
        aria-labelledby="recent-listings"
      >
        <div className={containerClass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="type-eyebrow text-primary">Live Campus Listings</p>
              <h2
                id="recent-listings"
                className="type-section mt-1.5 text-2xl font-semibold text-ink sm:text-3xl"
              >
                Recently reported on campus
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-mute">
              Real-time records from students and staff across GCOEC departments and facilities.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Recent Lost Reports */}
            <Reveal className="rounded-card border border-line bg-surface p-5 sm:p-6 shadow-sm shadow-black/5">
              <div className="flex items-center justify-between pb-4 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-control border border-lost/25 bg-lost/10 text-lost">
                    <LostIcon size={16} />
                  </span>
                  <div>
                    <h3 className="type-card text-base font-semibold text-ink">
                      Recent Lost Items
                    </h3>
                    <p className="text-xs text-mute">Misplaced on campus</p>
                  </div>
                </div>
                <Link
                  to="/lost-items"
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-control px-2 text-xs font-semibold text-primary transition-colors duration-150 hover:bg-frost focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  View all lost
                  <ArrowRightIcon size={12} />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {lostLoading ? (
                  <div className="py-8 text-center text-sm text-mute">
                    Loading recent lost items…
                  </div>
                ) : lostError ? (
                  <div className="rounded-control border border-lost/25 bg-lost/5 p-3.5 text-xs text-lost">
                    Could not load recent lost items. Please check the lost items page.
                  </div>
                ) : activeLost.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm font-medium text-ink">
                      No active lost items reported
                    </p>
                    <p className="mt-1 text-xs text-mute">
                      When someone reports a missing belonging, it will appear here.
                    </p>
                    <Link
                      to="/report-lost"
                      className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      Report a lost item &rarr;
                    </Link>
                  </div>
                ) : (
                  activeLost.map((item) => (
                    <RecentItemRow
                      key={item.id}
                      item={item}
                      kind="lost"
                      status={item.status}
                    />
                  ))
                )}
              </div>
            </Reveal>

            {/* Recent Found Reports */}
            <Reveal delay={100} className="rounded-card border border-line bg-surface p-5 sm:p-6 shadow-sm shadow-black/5">
              <div className="flex items-center justify-between pb-4 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-control border border-found/25 bg-found/10 text-found">
                    <FoundIcon size={16} />
                  </span>
                  <div>
                    <h3 className="type-card text-base font-semibold text-ink">
                      Recent Found Items
                    </h3>
                    <p className="text-xs text-mute">Turned in or located</p>
                  </div>
                </div>
                <Link
                  to="/found-items"
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-control px-2 text-xs font-semibold text-found transition-colors duration-150 hover:bg-found-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  View all found
                  <ArrowRightIcon size={12} />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {foundLoading ? (
                  <div className="py-8 text-center text-sm text-mute">
                    Loading recent found items…
                  </div>
                ) : foundError ? (
                  <div className="rounded-control border border-found/25 bg-found/5 p-3.5 text-xs text-found">
                    Could not load recent found items. Please check the found items page.
                  </div>
                ) : activeFound.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm font-medium text-ink">
                      No active found items reported
                    </p>
                    <p className="mt-1 text-xs text-mute">
                      When someone turns in a found belonging, it will appear here.
                    </p>
                    <Link
                      to="/report-found"
                      className="mt-3 inline-block text-xs font-semibold text-found hover:underline"
                    >
                      Report a found item &rarr;
                    </Link>
                  </div>
                ) : (
                  activeFound.map((item) => (
                    <RecentItemRow
                      key={item.id}
                      item={item}
                      kind="found"
                      status={item.status}
                    />
                  ))
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. 4-Step Recovery Process */}
      <section
        id="recovery-workflow"
        className="border-b border-line bg-paper py-14 sm:py-16"
        aria-labelledby="workflow-heading"
      >
        <div className={containerClass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="type-eyebrow text-primary">Process</p>
              <h2
                id="workflow-heading"
                className="type-section mt-1.5 text-2xl font-semibold text-ink sm:text-3xl"
              >
                How property gets returned
              </h2>
            </div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-mute">
              <ShieldIcon size={14} className="text-pending shrink-0" />
              Claims are reviewed by the campus administrator before items are returned.
            </p>
          </div>

          <ol className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RECOVERY_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <Reveal as="li" key={step.title} delay={index * 80} className="min-w-0">
                  <div className="h-full rounded-card border border-line bg-surface p-5 shadow-sm shadow-black/5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-control border border-line bg-paper text-primary">
                      <StepIcon size={16} />
                    </span>
                    <h3 className="type-card mt-3.5 text-base font-semibold text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-mute">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 4. Built for GCOEC Platform Standards */}
      <section
        className="border-b border-line bg-surface py-14 sm:py-16"
        aria-labelledby="campus-standards-heading"
      >
        <div className={containerClass}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="min-w-0 lg:col-span-5">
              <p className="type-eyebrow text-primary">Platform Standards</p>
              <h2
                id="campus-standards-heading"
                className="type-section mt-1.5 text-2xl font-semibold text-ink sm:text-3xl"
              >
                Built for GCOEC
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-mute">
                A straightforward, transparent campus registry helping students and
                staff report, match, and recover lost property without unnecessary overhead.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button to="/lost-items" variant="secondary">
                  Browse Lost Items
                </Button>
                <Button to="/found-items" variant="secondary">
                  Browse Found Items
                </Button>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {CAMPUS_PRINCIPLES.map((feature, index) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <Reveal
                      as="li"
                      key={feature.title}
                      delay={index * 80}
                      className="rounded-card border border-line bg-surface p-4 sm:p-5 shadow-sm shadow-black/5"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-paper text-primary">
                        <FeatureIcon size={16} />
                      </span>
                      <h3 className="type-card mt-2.5 text-sm font-semibold text-ink">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-mute">
                        {feature.description}
                      </p>
                    </Reveal>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
