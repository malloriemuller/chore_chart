const TTL_MS = 10_000;

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const entry = store.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value as T;
  }
  const value = await load();
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
  return value;
}

export function invalidate(key: string): void {
  store.delete(key);
}

export function invalidateAll(): void {
  store.clear();
}
