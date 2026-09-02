import { formatDisplayDate } from "../utils/items";

function FoundItemCard({ item }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border">

      <h2 className="text-2xl font-bold text-green-600">
        {item.itemName}
      </h2>

      <p className="mt-3">
        <strong>Category:</strong> {item.category}
      </p>

      <p>
        <strong>Description:</strong> {item.description}
      </p>

      <p>
        <strong>Location:</strong> {item.location}
      </p>

      <p>
        <strong>Date Found:</strong> {formatDisplayDate(item.dateFound || item.date_found)}
      </p>

      <p>
        <strong>Contact:</strong> {item.contact}
      </p>

    </div>
  );
}

export default FoundItemCard;