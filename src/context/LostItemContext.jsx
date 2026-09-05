import { createContext, useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

export const LostItemContext = createContext();

function LostItemProvider({ children }) {
  const [lostItems, setLostItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  function dismissLoadError() {
    setLoadError(null);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiRequest("/api/lost-items");
        if (cancelled) return;
        const items = data && Array.isArray(data.items) ? data.items : [];
        setLostItems(items);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        console.error("[LostItemContext] Failed to load lost items from API:", err);
        setLoadError(
          "Could not load lost items. Please check your connection and try again."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function addLostItem(itemData) {
    const data = await apiRequest("/api/lost-items", {
      method: "POST",
      body: itemData,
    });
    const savedItem = data && data.item;
    if (!savedItem) {
      const err = new Error("Failed to save lost item.");
      err.code = "API_ERROR";
      throw err;
    }
    setLostItems((prev) => [...prev, savedItem]);
    return savedItem;
  }

  async function updateLostItem(updatedItem) {
    const data = await apiRequest(`/api/lost-items/${updatedItem.id}`, {
      method: "PUT",
      body: updatedItem,
    });
    const savedItem = data && data.item;
    if (!savedItem) {
      const err = new Error("Failed to update lost item.");
      err.code = "API_ERROR";
      throw err;
    }
    setLostItems((prev) =>
      prev.map((item) =>
        String(item.id) === String(savedItem.id) ? savedItem : item
      )
    );
    return savedItem;
  }

  async function deleteLostItem(id) {
    await apiRequest(`/api/lost-items/${id}`, { method: "DELETE" });
    setLostItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
  }

  return (
    <LostItemContext.Provider
      value={{
        lostItems,
        setLostItems,
        addLostItem,
        updateLostItem,
        deleteLostItem,
        isLoading,
        loadError,
        dismissLoadError,
      }}
    >
      {children}
    </LostItemContext.Provider>
  );
}

export default LostItemProvider;