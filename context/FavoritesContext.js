import { createContext, useContext, useState } from 'react';

// 1. Create the Context
const FavoritesContext = createContext();

// 2. Create the Provider (This wraps around your app)
export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]); // Now it's an array!

  // Function to add or remove an ID from the array
  const toggleFavorite = (id) => {
    setFavorites((currentFavorites) => {
      if (currentFavorites.includes(id)) {
        return currentFavorites.filter((favId) => favId !== id); // Remove it
      } else {
        return [...currentFavorites, id]; // Add it
      }
    });
  };

  // Helper to check if an item is favorited
  const isFavorite = (id) => {
    return favorites.includes(id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

// 3. Custom Hook to use in your screens
export const useFavorites = () => useContext(FavoritesContext);