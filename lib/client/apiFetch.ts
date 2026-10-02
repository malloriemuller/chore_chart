function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error: unknown }).error;
    if (typeof err === "string") return err;
    if (Array.isArray(err) && err[0] && typeof err[0] === "object" && "message" in err[0]) {
      return String((err[0] as { message: unknown }).message);
    }
  }
  return `Request failed (${status})`;
}

/** fetch() that throws a readable Error on any non-2xx response, instead of resolving silently. */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(extractErrorMessage(body, response.status));
  }
  return response;
}
