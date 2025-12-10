
import { Song, Playlist, UserPreferences } from "../types";

const DB_NAME = "MeloWeatherDB";
const DB_VERSION = 1;
const STORES = {
  PREFERENCES: "preferences",
  LIKED_SONGS: "liked_songs",
  PLAYLISTS: "playlists"
};

// Veritabanı Bağlantısı Açma
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Veritabanı açılamadı.");

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Tercihler Store'u (Tekil kayıt)
      if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
        db.createObjectStore(STORES.PREFERENCES, { keyPath: "id" });
      }

      // Beğenilen Şarkılar Store'u
      if (!db.objectStoreNames.contains(STORES.LIKED_SONGS)) {
        db.createObjectStore(STORES.LIKED_SONGS, { keyPath: "id" });
      }

      // Playlistler Store'u
      if (!db.objectStoreNames.contains(STORES.PLAYLISTS)) {
        db.createObjectStore(STORES.PLAYLISTS, { keyPath: "id" });
      }
    };
  });
};

// --- GENERIC HELPERS ---

const putItem = async (storeName: string, item: any) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getItem = async (storeName: string, key: string) => {
  const db = await openDB();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAllItems = async (storeName: string) => {
  const db = await openDB();
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteItem = async (storeName: string, key: string) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- PUBLIC API ---

// 1. Preferences
export const saveUserPreferences = async (prefs: UserPreferences) => {
  await putItem(STORES.PREFERENCES, { id: "user_settings", ...prefs });
};

export const getUserPreferences = async (): Promise<UserPreferences | null> => {
  const data = await getItem(STORES.PREFERENCES, "user_settings");
  return data || null;
};

// 2. Liked Songs
export const toggleLikeSongDB = async (song: Song): Promise<boolean> => {
  // Önce var mı kontrol et
  const existing = await getItem(STORES.LIKED_SONGS, song.id);
  if (existing) {
    await deleteItem(STORES.LIKED_SONGS, song.id);
    return false; // Çıkarıldı
  } else {
    await putItem(STORES.LIKED_SONGS, song);
    return true; // Eklendi
  }
};

export const getLikedSongsDB = async (): Promise<Song[]> => {
  return await getAllItems(STORES.LIKED_SONGS);
};

// 3. Playlists
export const savePlaylistDB = async (playlist: Playlist) => {
  await putItem(STORES.PLAYLISTS, playlist);
};

export const getPlaylistsDB = async (): Promise<Playlist[]> => {
  return await getAllItems(STORES.PLAYLISTS);
};

export const deletePlaylistDB = async (playlistId: string) => {
  await deleteItem(STORES.PLAYLISTS, playlistId);
};
