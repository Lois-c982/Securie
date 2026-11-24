import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import { auth } from '@/lib/firebase';
import { createFavouritesStore } from './favourites-store';

const FavouritesContext = createContext(null);

export function FavouritesProvider({ children }) {
  const [store] = useState(() =>
    createFavouritesStore(
      AsyncStorage,
      () => auth.currentUser?.uid ?? null
    )
  );

  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      void store.selectUser(user?.uid ?? null);
    });

    return () => {
      unsubscribe();
      store.stop();
    };
  }, [store]);

  return (
    <FavouritesContext.Provider
      value={{
        ...state,
        toggleFavourite: store.toggleFavourite,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  return useContext(FavouritesContext);
}