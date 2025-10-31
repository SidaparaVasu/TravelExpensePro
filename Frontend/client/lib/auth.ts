export const AUTH_TOKEN_ACCESS = "access_token";
export const AUTH_TOKEN_REFRESH = "refresh_token";
export const AUTH_USER_KEY = "user";

export function isAuthenticated() {
  return !!localStorage.getItem(AUTH_TOKEN_ACCESS);
}

export function saveAuth(access_token: string, refresh_token: string, user: unknown) {
  localStorage.setItem(AUTH_TOKEN_ACCESS, access_token);
  localStorage.setItem(AUTH_TOKEN_REFRESH, refresh_token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_ACCESS);
  localStorage.removeItem(AUTH_TOKEN_REFRESH);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getUser<T = any>(): T | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isAdminUser() {
  return JSON.parse(localStorage.getItem('roles'));
}