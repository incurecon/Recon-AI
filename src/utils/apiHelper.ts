/**
 * Safely fetches JSON from an API endpoint, preventing "Unexpected token '<', '<!doctype ...'" errors
 * when a server route returns HTML (e.g. 404 or 500 error pages).
 */
export async function fetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const token = localStorage.getItem('incurecon_token');
  const headers = new Headers(options?.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  }

  // Handle HTML or non-JSON response gracefully
  const text = await res.text();
  let parsedData: any = {};

  try {
    parsedData = JSON.parse(text);
  } catch {
    parsedData = {
      error: res.ok
        ? 'Received non-JSON response from server.'
        : `Server error (${res.status}): Please check backend connection.`,
    };
  }

  return { ok: res.ok, status: res.status, data: parsedData };
}
