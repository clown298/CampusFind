import { useContext, useState } from "react";
import { LostItemContext } from "../context/LostItemContext";
import { formatDisplayDate } from "../utils/items";

function LostItemCard({ item }) {

  const { deleteLostItem, updateLostItem } =
    useContext(LostItemContext);

  const [editing, setEditing] = useState(false);

  const [itemName, setItemName] = useState(item.itemName);
  const [category, setCategory] = useState(item.category);

  function handleSave() {
    updateLostItem({
      ...item,
      itemName,
      category,
    });

    setEditing(false);
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border">

      {editing ? (
        <>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full border p-2 rounded mb-3"
          />

          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border p-2 rounded mb-3"
          />

          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-blue-600">
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
            <strong>Date Lost:</strong> {formatDisplayDate(item.dateLost || item.date_lost)}
          </p>

          <p>
            <strong>Contact:</strong> {item.contact}
          </p>

          <div className="flex gap-3 mt-5">

            <button
              onClick={() => setEditing(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Edit
            </button>

            <button
              onClick={() => deleteLostItem(item.id)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Delete
            </button>

          </div>
        </>
      )}

    </div>
  );
}

export default LostItemCard;