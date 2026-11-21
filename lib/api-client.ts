// Shared fetch wrapper for all client → API calls.

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

let redirecting401 = false

async function handleUnauthorized() {
  if (redirecting401 || typeof window === "undefined") return
  redirecting401 = true
  try {
    const { signOut } = await import("next-auth/react")
    await signOut({ redirect: false })
    if (window.location.pathname !== "/login") {
      // Absolute URL avoids Next's no-relative-location-assign lint rule and
      // behaves identically for a hard session-expiry redirect.
      window.location.replace(new URL("/login", window.location.origin).href)
    }
  } finally {
    // Reset so a later legit re-auth can retry.
    setTimeout(() => {
      redirecting401 = false
    }, 2000)
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  /** Return the raw Response (with headers) instead of parsed JSON. */
  raw?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, raw, ...rest } = options
  const res = await fetch(path, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Raw callers read the body themselves — don't consume the stream here.
  if (raw) {
    if (!res.ok) {
      if (res.status === 401) {
        // Session expired — bounce the user to the login screen.
        void handleUnauthorized()
      }
      throw new ApiError(res.status, res.statusText || "Request failed.")
    }
    return res as unknown as T
  }

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      // Non-JSON body (HTML error pages, plain-text proxies) — leave null.
      data = null
    }
  }

  if (!res.ok) {
    let message = res.statusText || "Request failed."
    if (data && typeof data === "object" && "error" in data) {
      const errVal = (data as { error: unknown }).error
      if (typeof errVal === "string" && errVal.length > 0) message = errVal
    }
    if (res.status === 401) {
      // Session expired — bounce the user to the login screen.
      void handleUnauthorized()
    }
    throw new ApiError(res.status, message)
  }

  if (raw) return res as unknown as T
  return data as T
}
