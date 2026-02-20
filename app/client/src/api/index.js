const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const api = USE_MOCK
  ? (await import("./mockServer.js")).api
  : (await import("./realServer.js")).api;