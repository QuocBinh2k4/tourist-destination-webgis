function getTrustedOrigins() {
  const configured = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  const origins = new Set([configured]);
  if (process.env.NODE_ENV !== "production") {
    const url = new URL(configured);
    if (["localhost", "127.0.0.1"].includes(url.hostname)) {
      url.hostname = url.hostname === "localhost" ? "127.0.0.1" : "localhost";
      origins.add(url.origin);
    }
  }
  return [...origins];
}

module.exports = { getTrustedOrigins };
