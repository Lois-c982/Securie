// These lists are stored on this device.
// Account separation does not encrypt the stored data.

export function favouritesKey(uid) {
  return uid === null
    ? 'securie:favourites:v2:guest'
    : `securie:favourites:v2:user:${encodeURIComponent(uid)}`;
}

export function createFavouritesStore(storage, currentUid) {
  let state = {
    favouriteIds: [],
    loading: true,
    saving: false,
    loadError: '',
    saveError: '',
  };

  let generation = 0;
  let selectedUid;
  let active = false;

  // Process storage operations in order.
  let queue = Promise.resolve();

  const listeners = new Set();

  function publish(patch) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  function enqueue(work) {
    const result = queue.then(work);

    // A failed operation must not block later attempts.
    queue = result.catch(() => {});

    return result;
  }

  function isCurrent(version) {
    return active && version === generation;
  }

  async function selectUser(uid) {
    active = true;
    selectedUid = uid;

    const version = ++generation;

    // Immediately hide the previous account's favourites.
    publish({
      favouriteIds: [],
      loading: true,
      saving: false,
      loadError: '',
      saveError: '',
    });

    try {
      // Wait for any earlier save before reading the list.
      const stored = await enqueue(() =>
        storage.getItem(favouritesKey(uid))
      );

      const ids = stored === null ? [] : JSON.parse(stored);

      if (
        !Array.isArray(ids) ||
        ids.some((id) => typeof id !== 'string' || !id)
      ) {
        throw new Error('Invalid favourites data');
      }

      // Ignore results belonging to an older session.
      if (isCurrent(version)) {
        publish({
          favouriteIds: [...new Set(ids)],
          loading: false,
        });
      }
    } catch {
      if (isCurrent(version)) {
        publish({
          loading: false,
          loadError:
            'Couldn’t load favourites. Reopen Securie to try again.',
        });
      }
    }
  }

  async function toggleFavourite(placeId) {
    if (
      !active ||
      selectedUid !== currentUid() ||
      state.loading ||
      state.loadError ||
      state.saving ||
      typeof placeId !== 'string' ||
      !placeId
    ) {
      return;
    }

    const version = generation;

    // Capture the correct account's key before starting the save.
    const key = favouritesKey(selectedUid);

    const nextIds = state.favouriteIds.includes(placeId)
      ? state.favouriteIds.filter((id) => id !== placeId)
      : [...state.favouriteIds, placeId];

    publish({
      saving: true,
      saveError: '',
    });

    try {
      await enqueue(() =>
        storage.setItem(key, JSON.stringify(nextIds))
      );

      if (isCurrent(version)) {
        publish({
          favouriteIds: nextIds,
          saving: false,
        });
      }
    } catch {
      if (isCurrent(version)) {
        publish({
          saving: false,
          saveError:
            'Couldn’t update favourites. Please try again.',
        });
      }
    }
  }

  return {
    getSnapshot: () => state,

    subscribe(listener) {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },

    selectUser,
    toggleFavourite,

    stop() {
      active = false;
      generation += 1;
    },
  };
}