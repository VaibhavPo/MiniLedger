import { Platform } from 'react-native';

const DEFAULT_LOCAL_IP = '192.168.29.158';
const DEFAULT_URL =
  Platform.OS === 'android'
    ? `http://${DEFAULT_LOCAL_IP}:5000/api`
    : 'http://localhost:5000/api';

let BASE_URL = DEFAULT_URL;
let authToken: string | null = null;

export function normalizeBaseUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim();
  if (!trimmed) {
    return DEFAULT_URL;
  }
  // Ensure http:// or https:// protocol
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }
  // Strip trailing slashes
  trimmed = trimmed.replace(/\/+$/, '');
  // If user provided just host or host:port without path, or path without /api
  if (!trimmed.endsWith('/api')) {
    trimmed = `${trimmed}/api`;
  }
  return trimmed;
}

export function setBaseUrl(url: string): string {
  BASE_URL = normalizeBaseUrl(url);
  return BASE_URL;
}

export function getBaseUrl(): string {
  return BASE_URL;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function testConnection(rawUrl: string): Promise<{ ok: boolean; message?: string }> {
  const normalized = normalizeBaseUrl(rawUrl);
  // Health check endpoint is at root: http://host:port/health
  const rootHealthUrl = normalized.replace(/\/api\/?$/, '/health');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(rootHealthUrl, {
      method: 'GET',
      signal: controller.signal,
    }).catch(async () => {
      // If root/health fails, try pinging the API index directly
      return await fetch(normalized.replace(/\/api\/?$/, '/'), {
        method: 'GET',
        signal: controller.signal,
      });
    });

    clearTimeout(timeoutId);

    if (res && res.status < 500) {
      return { ok: true, message: 'Server responded successfully!' };
    }
    return { ok: false, message: `Server returned status ${res?.status || 'unknown'}` };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.name === 'AbortError' ? 'Connection timed out (4s)' : (error?.message || 'Could not reach server'),
    };
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}
