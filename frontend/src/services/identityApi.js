import { site } from "../config/site";

const request = async (path, options = {}) => {
  const response = await fetch(`${site.identityApiUrl}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || "Authentication request failed");
    error.status = response.status;
    throw error;
  }
  return payload.data;
};

export const getCurrentIdentity = () => request("/api/auth/me");

export const signInWithGoogle = (credential) =>
  request("/api/auth/google", {
    method: "POST",
    headers: { "X-Khiladi-Request": "identity-v1" },
    body: JSON.stringify({ credential }),
  });

export const logoutIdentity = () =>
  request("/api/auth/logout", {
    method: "POST",
    headers: { "X-Khiladi-Request": "identity-v1" },
  });

export const authorizeProduct = ({ product, redirectUri, codeChallenge, state }) =>
  request("/api/sso/authorize", {
    method: "POST",
    headers: { "X-Khiladi-Request": "identity-v1" },
    body: JSON.stringify({ product, redirectUri, codeChallenge, state }),
  });
