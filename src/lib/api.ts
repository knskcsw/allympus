/**
 * Parse JSON response from API, throwing an error if the response is not OK.
 */
export async function parseJsonResponse<T = unknown>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.error || text;
    } catch {
      // Fallback to raw text when not JSON.
    }
    throw new Error(message || "Request failed");
  }
  return text ? (JSON.parse(text) as T) : null;
}

/**
 * API request helper with JSON body
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
  } = {}
): Promise<T | null> {
  const { method = "GET", body } = options;
  const fetchOptions: RequestInit = {
    method,
    cache: "no-store",
  };

  if (body !== undefined) {
    fetchOptions.headers = { "Content-Type": "application/json" };
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  return parseJsonResponse<T>(response);
}
