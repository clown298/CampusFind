import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
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
} from "../components/icons";

const SCOPES = [
  { value: "all", label: "All" },
  { value: "lost", label: "Lost" },
  { value: "found", label: "Found" },
];

const SCOPE_ACTIVE = {
  all: "bg-surface text-ink shadow-sm",
  lost: "bg-lost/10 text-lost",
  found: "bg-found/10 text-found",
};

const RECOVERY_STEPS = [
  {
    icon: ReportIcon,
    title: "Report",
    description:
      "Add what was lost or found so people on campus can see it.",
  },
  {
    icon: MatchIcon,
    title: "Match",
    description:
      "Possible matches connect found items with reports of what students have lost.",
  },
  {
    icon: VerifyIcon,
    title: "Verify",
    description:
      "A recovery request helps confirm ownership before the item changes hands.",
  },
  {
    icon: RecoverIcon,
    title: "Recover",
    description:
      "The item is returned and the listing is marked as recovered.",
  },
];

const WHY_ITEMS = [
  {
    icon: CampusIcon,
    title: "Campus-focused",
    description:
      "Listings are focused on the GCOEC campus community.",
  },
  {
    icon: ReportIcon,
    title: "Organized reports",
    description:
      "Each report includes useful details such as category, location, and date.",
  },
  {
    icon: ShieldIcon,
    title: "Secure recovery",
    description:
      "Recovery requests help confirm ownership before an item changes hands.",
  },
  {
    icon: MatchIcon,
    title: "Possible matches",
    description:
      "Lost and found reports can be compared to help connect items with their owners.",
  },
];

const containerClass =
  "mx-auto w-full min-w-0 max-w-[1440px] px-4 sm:px-8";

function HeroSearch({
  query,
  setQuery,
  scope,
  setScope,
  handleSearch,
  handleSearchKeyDown,
}) {
  return (
    <div className="w-full max-w-xl rounded-card bg-surface p-2.5 lg:max-w-none">
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
              "min-h-[44px] flex-1 cursor-pointer rounded-control px-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
              scope === s.value
                ? SCOPE_ACTIVE[s.value]
                : "text-mute hover:text-ink",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex min-h-[52px] items-center gap-2 rounded-control border border-line bg-surface px-3.5 transition-colors duration-150 focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/30">
        <SearchIcon className="h-5 w-5 shrink-0 text-mute" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search by item, category, or location"
          aria-label="Search lost and found items"
          className="h-12 w-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink placeholder:text-mute/70 focus:outline-none focus:ring-0"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control bg-ink px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-ink-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Search
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-1 px-1 pb-1">
        <Link
          to="/lost-items"
          className="inline-flex min-h-[36px] items-center gap-1.5 text-sm font-semibold text-ink/70 transition-colors duration-200 hover:text-lost focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <LostIcon size={16} className="text-lost" />
          I lost something
        </Link>
        <Link
          to="/found-items"
          className="inline-flex min-h-[36px] items-center gap-1.5 text-sm font-semibold text-ink/70 transition-colors duration-200 hover:text-found focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <FoundIcon size={16} className="text-found" />
          I found something
        </Link>
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");

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

  return (
    <div className="w-full min-w-0 overflow-x-clip">
      {/* 1. Main entry — refined dark band, statement left, actions deck right */}
      <section className="bg-ink" aria-labelledby="main-entry">
        <div className={containerClass}>
          <div className="grid grid-cols-1 items-center gap-10 py-12 lg:grid-cols-12 lg:gap-14 lg:py-16">
            <div className="min-w-0 lg:col-span-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                <span
                  className="h-2 w-2 rounded-full bg-canopy"
                  aria-hidden="true"
                />
                GCOEC &bull; Campus Lost &amp; Found
              </p>

              <h1 className="type-display mt-5 text-4xl text-white sm:text-5xl lg:text-[3.5rem]">
                Report it, match it, get it back.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
                CampusFind is the campus registry for lost and found items at
                GCOEC. Report what you lost or found, check the listings, and
                follow the recovery process in one place.
              </p>
            </div>

            <div className="min-w-0 lg:col-span-5">
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

      {/* 2. Make a report — heading column + one shared twin-panel surface */}
      <section className="bg-paper" aria-labelledby="make-a-report">
        <div className={containerClass}>
          <div className="grid grid-cols-1 gap-8 py-12 lg:grid-cols-12 lg:gap-14 lg:py-16">
            <div className="lg:col-span-4">
              <p className="type-eyebrow text-mute">Make a report</p>
              <h2
                id="make-a-report"
                className="type-section mt-2.5 text-2xl text-ink sm:text-3xl"
              >
                Two reports, one registry
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-6 text-mute">
                Lost something? Found something? The details you add are what
                help someone identify it, or help it get back to its owner.
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="overflow-hidden rounded-card border border-line bg-surface sm:grid sm:grid-cols-2">
                <div className="flex flex-col p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-lost text-white">
                      <LostIcon size={20} />
                    </span>
                    <h3 className="type-card text-lg text-ink">
                      You lost something
                    </h3>
                  </div>
                  <p className="mt-3 flex-1 text-[15px] leading-6 text-mute">
                    Report what you lost with the details that can help someone
                    identify it.
                  </p>
                  <div className="mt-6">
                    <Button
                      to="/report-lost"
                      variant="secondary"
                      className="w-full gap-2"
                    >
                      Report Lost Item
                      <ArrowRightIcon size={16} className="text-lost" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col border-t border-line p-6 sm:border-l sm:border-t-0 sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-found text-white">
                      <FoundIcon size={20} />
                    </span>
                    <h3 className="type-card text-lg text-ink">
                      You found something
                    </h3>
                  </div>
                  <p className="mt-3 flex-1 text-[15px] leading-6 text-mute">
                    Report what you found so its owner has a chance to get it
                    back.
                  </p>
                  <div className="mt-6">
                    <Button
                      to="/report-found"
                      variant="secondary"
                      className="w-full gap-2"
                    >
                      Report Found Item
                      <ArrowRightIcon size={16} className="text-found" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Registry access — one shared surface, two entry rows */}
      <section className="py-12 lg:py-16" aria-labelledby="browse-listings">
        <div className={containerClass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div>
              <p className="type-eyebrow text-mute">Registry access</p>
              <h2
                id="browse-listings"
                className="type-section mt-2.5 text-2xl text-ink sm:text-3xl"
              >
                Browse the listings
              </h2>
            </div>
            <p className="max-w-lg text-[15px] leading-6 text-mute">
              Check lost and found reports, view item details, and request
              recovery when you find a possible match.
            </p>
          </div>

          <div className="mt-7 overflow-hidden rounded-card border border-line bg-surface sm:grid sm:grid-cols-2">
            <Link
              to="/lost-items"
              className="group flex items-center justify-between gap-4 p-5 transition-colors duration-200 hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:p-6"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-lost/10 text-lost">
                  <LostIcon size={24} />
                </span>
                <span className="min-w-0">
                  <span className="type-card block text-lg text-ink">
                    Lost Items
                  </span>
                  <span className="mt-1 block text-sm text-mute">
                    Items reported missing across campus
                  </span>
                </span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-mute transition-colors duration-200 group-hover:border-lost group-hover:bg-lost group-hover:text-white">
                <ArrowRightIcon size={18} />
              </span>
            </Link>

            <Link
              to="/found-items"
              className="group flex items-center justify-between gap-4 border-t border-line p-5 transition-colors duration-200 hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:border-l sm:border-t-0 sm:p-6"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-found/10 text-found">
                  <FoundIcon size={24} />
                </span>
                <span className="min-w-0">
                  <span className="type-card block text-lg text-ink">
                    Found Items
                  </span>
                  <span className="mt-1 block text-sm text-mute">
                    Items reported as found across campus
                  </span>
                </span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-mute transition-colors duration-200 group-hover:border-found group-hover:bg-found group-hover:text-white">
                <ArrowRightIcon size={18} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Recovery process — one connected workflow panel */}
      <section className="bg-paper" aria-labelledby="recovery-process">
        <div className={containerClass}>
          <div className="py-12 lg:py-16">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div>
                <p className="type-eyebrow text-canopy">Recovery</p>
                <h2
                  id="recovery-process"
                  className="type-section mt-2.5 text-2xl text-ink sm:text-3xl"
                >
                  How an item gets back to you
                </h2>
              </div>
              <p className="flex max-w-md items-start gap-2 text-sm leading-6 text-mute">
                <ShieldIcon
                  size={16}
                  className="mt-1 shrink-0 text-pending"
                  aria-hidden="true"
                />
                Ownership is confirmed before an item changes hands.
              </p>
            </div>

            <ol className="mt-7 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
              {RECOVERY_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="flex min-w-0 flex-col bg-surface p-5 md:p-6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-canopy/10 text-canopy">
                        <StepIcon size={18} />
                      </span>
                      <span className="type-eyebrow text-mute/70">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="type-card mt-4 text-base text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-mute">
                      {step.description}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* 5. Built for GCOEC — system summary */}
      <section className="py-12 lg:py-16" aria-labelledby="why-campusfind">
        <div className={containerClass}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <p className="type-eyebrow text-mute">About CampusFind</p>
              <h2
                id="why-campusfind"
                className="type-section mt-2.5 text-2xl text-ink sm:text-3xl"
              >
                Built for GCOEC
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-6 text-mute">
                A simple campus system for reporting, matching, and recovering
                lost belongings.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                {WHY_ITEMS.map((feature) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="flex flex-col gap-3 sm:flex-row sm:items-start"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-paper text-ink">
                        <FeatureIcon size={20} />
                      </span>
                      <div>
                        <h3 className="type-card text-base text-ink">
                          {feature.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-6 text-mute">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;