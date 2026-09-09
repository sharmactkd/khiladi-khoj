export const site = Object.freeze({
  academyUrl: import.meta.env.VITE_ACADEMY_MANAGER_URL || "https://academy.khiladi-khoj.com",
  tournamentUrl: import.meta.env.VITE_TOURNAMENT_MANAGER_URL || "https://tournaments.khiladi-khoj.com",
  identityApiUrl:
    import.meta.env.VITE_IDENTITY_API_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : ""),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
});
