// Helper utility to resolve backend API URL
// Uses relative /api endpoints by default so both Vercel serverless functions and local Express dev server work seamlessly.

export const BACKEND_URL = ((import.meta as any).env?.VITE_BACKEND_URL as string) || '';

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (BACKEND_URL && BACKEND_URL.trim().length > 0) {
    const cleanBackend = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
    return `${cleanBackend}${cleanEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
  }

  return cleanEndpoint.replace(/\/{2,}/g, '/');
}
