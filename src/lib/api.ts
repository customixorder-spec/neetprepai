// Helper utility to resolve backend API URL
// Enables cross-origin requests from Vercel (e.g. neetprep.vercel.app) to the AI Studio Cloud Run backend

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://ais-dev-7gu5l537srg7dayufiwsv7-133578617612.asia-southeast1.run.app';

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If in browser and running on Vercel or external domain, proxy calls to the Cloud Run backend server
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isCloudRun = hostname.includes('run.app');

    if (!isLocalhost && !isCloudRun) {
      // Running on Vercel or custom domain -> route to AI Studio backend
      return `${BACKEND_URL}${cleanEndpoint}`;
    }
  }

  return cleanEndpoint;
}
