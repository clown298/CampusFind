export function getItemName(item) {
  return item.itemName || item.item_name || "";
}

export function getItemDate(item, type) {
  if (type === "found") {
    return item.dateFound || item.date_found || "";
  }

  return item.dateLost || item.date_lost || "";
}

export function formatDisplayDate(rawDate) {
  if (!rawDate || typeof rawDate !== "string") return "";

  const ymd = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const year = Number(ymd[1]);
    const monthIndex = Number(ymd[2]) - 1;
    const day = Number(ymd[3]);
    const localDate = new Date(year, monthIndex, day);
    if (!Number.isNaN(localDate.getTime())) {
      return localDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  const fallback = new Date(rawDate);
  if (!Number.isNaN(fallback.getTime())) {
    const localDate = new Date(
      fallback.getFullYear(),
      fallback.getMonth(),
      fallback.getDate()
    );
    return localDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return "";
}

export function getItemTimestamp(item, type) {
  const raw = getItemDate(item, type);
  const ymd = typeof raw === "string" ? raw.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  if (ymd) {
    const localDate = new Date(
      Number(ymd[1]),
      Number(ymd[2]) - 1,
      Number(ymd[3]),
      12,
      0,
      0
    );
    const ms = localDate.getTime();
    if (!Number.isNaN(ms)) return ms;
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  const id = Number(item.id);
  return Number.isNaN(id) ? 0 : id;
}
