"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "chore-board-kiosk";
const CHANGE_EVENT = "chore-board-kiosk-change";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot(): boolean {
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot(): boolean {
  return false; // SSR can't read this device's localStorage; the client corrects it post-hydration.
}

export function useKioskMode(): [boolean, (value: boolean) => void] {
  const kiosk = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setKiosk = useCallback((value: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, String(value));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [kiosk, setKiosk];
}
