const ACCESS_TOKEN_KEY = "programa-social:access-token";
const REFRESH_TOKEN_KEY = "programa-social:refresh-token";
const USER_KEY = "programa-social:user";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);
  return rawUser ? JSON.parse(rawUser) : null;
}

export function setSession({ accessToken, refreshToken, user }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
