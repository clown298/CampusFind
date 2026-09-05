import { useMemo } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import { findPossibleMatches } from "../utils/matching";
import { formatDisplayDate, getItemDate, getItemName } from "../utils/items";

function PossibleMatches({
  type,
  item,
  candidates,
  candidatesLoading,
  candidatesLoadError,
}) {
  const oppositeType = type === "found" ? "lost" : "found";
  const oppositeLabel = oppositeType === "found" ? "found items" : "lost items";

  const matches = useMemo(
    () => findPossibleMatches(item, candidates || [], type === "found"),
    [item, candidates, type]
  );

  return (
    <section className="mt-8 sm:mt-10">
      <h2 className="font-serif text-2xl font-semibold text-ink">
        Possible Matches
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
        The following {oppositeLabel} may describe the same physical item.
        These are suggestions based on name, category, location, date, and
        description — not confirmations.
      </p>

      {candidatesLoading ? (
        <div
          className="mt-4 rounded-[8px] border border-line bg-surface px-5 py-8 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-mute">
            Checking for possible matches…
          </p>
        </div>
      ) : candidatesLoadError ? (
        <div
          className="mt-4 rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
          role="alert"
        >
          <p className="font-semibold">Possible matches unavailable</p>
          <p className="mt-1">{candidatesLoadError}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-4 rounded-[8px] border border-line bg-surface px-5 py-8 text-center">
          <p className="text-sm text-mute">No possible matches found yet.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {matches.map((match) => {
            const oppositeOfThis = oppositeType;
            const detailPath =
              oppositeOfThis === "found"
                ? `/found-items/${match.item.id}`
                : `/lost-items/${match.item.id}`;
            const accentClass =
              oppositeOfThis === "found" ? "text-canopy" : "text-brick";
            const dateText = formatDisplayDate(
              getItemDate(match.item, oppositeOfThis)
            );

            return (
              <li
                key={match.item.id}
                className="rounded-[8px] border border-line bg-surface p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to={detailPath}
                      className={`inline-block break-words font-serif text-xl font-semibold no-underline transition-colors duration-200 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-[4px] -m-1 p-1 ${accentClass}`}
                      aria-label={`View ${oppositeOfThis} item: ${getItemName(match.item)}`}
                    >
                      {getItemName(match.item)}
                    </Link>

                    <dl className="mt-3 space-y-1 break-words text-sm text-ink">
                      <div>
                        <dt className="inline font-semibold">Category: </dt>
                        <dd className="inline">{match.item.category}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Location: </dt>
                        <dd className="inline">{match.item.location}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">
                          {oppositeOfThis === "found" ? "Date found: " : "Date lost: "}
                        </dt>
                        <dd className="inline">{dateText}</dd>
                      </div>
                    </dl>

                    {match.reasons.length > 0 ? (
                      <p className="mt-3 text-sm font-medium leading-6 text-ink">
                        {match.reasons.join(" · ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 sm:pl-4">
                    <p className="inline-flex items-center rounded-[4px] border border-line bg-paper px-2.5 py-1 text-sm font-semibold text-ink">
                      {match.score}% match
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    to={detailPath}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    View item
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default PossibleMatches;