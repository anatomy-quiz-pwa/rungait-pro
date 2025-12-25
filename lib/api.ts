const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }
export type JSON = Record<string, JSONValue>

async function request<T = JSON>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }

  return res.json() as Promise<T>
}

export function getHealth() {
  return request<{ ok: boolean; ts: number }>("/api/health")
}

export function postExample(body: unknown) {
  return request<JSON>("/api/example", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

