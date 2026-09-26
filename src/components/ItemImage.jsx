import { FoundIcon, LostIcon } from "./icons";

function ItemImage({
  type = "lost",
  imageData,
  alt = "",
  className = "",
  groupHover = false,
  compact = false,
}) {
  if (imageData) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-paper ${className}`}
      >
        <img
          src={imageData}
          alt={alt}
          className={`h-full w-full object-contain ${
            groupHover
              ? "transition-[filter] duration-300 ease-out group-hover:brightness-105"
              : ""
          }`}
        />
      </div>
    );
  }

  const isFound = type === "found";
  const Icon = isFound ? FoundIcon : LostIcon;

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-2 bg-paper text-mute ${className}`}
    >
      <Icon size={24} aria-hidden="true" />
      {!compact ? (
        <span className="text-xs font-medium text-mute">
          No photo provided
        </span>
      ) : null}
      <span className="sr-only">
        No photo provided for this {isFound ? "found" : "lost"} item.
      </span>
    </div>
  );
}

export default ItemImage;