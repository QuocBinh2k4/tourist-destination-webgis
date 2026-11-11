const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { pool } = require("../config/db");
const argon2 = require("argon2");
const originalQuery = pool.query;
const originalOrigin = process.env.FRONTEND_ORIGIN;
let server;
let base;
let passwordHash;
let loginCalls = 0;

before(async () => {
  process.env.FRONTEND_ORIGIN = "http://localhost:5173";
  passwordHash = await argon2.hash("test-password");
  pool.query = async (sql, params) => {
    if (sql.includes("JOIN tourism.tai_khoan")) {
      const { hashToken } = require("../middleware/auth");
      const role = ["admin", "editor", "viewer"].find((_, i) =>
        params[0] === hashToken(String(i + 1).repeat(64)));
      return { rowCount: role ? 1 : 0, rows: role ? [{ id: 1, vai_tro: role }] : [] };
    }
    if (sql.includes("mat_khau_hash")) {
      loginCalls++;
      return { rows: [{ id: 1, ten_dang_nhap: "admin", mat_khau_hash: passwordHash, vai_tro: "admin" }] };
    }
    if (sql.includes("INSERT INTO tourism.phien_dang_nhap") || sql.includes("DELETE FROM tourism.phien_dang_nhap")) return {};
    throw new Error("Unexpected database access: " + sql);
  };
  server = require("../app").listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (originalOrigin === undefined) delete process.env.FRONTEND_ORIGIN;
  else process.env.FRONTEND_ORIGIN = originalOrigin;
  pool.query = originalQuery;
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
});

function request(path, method = "GET", role, origin = "http://localhost:5173", body) {
  const headers = { Origin: origin, "Content-Type": "application/json" };
  if (role) headers.Cookie = `tg_session=${String(["admin", "editor", "viewer"].indexOf(role) + 1).repeat(64)}`;
  return fetch(base + path, { method, headers, body: body && JSON.stringify(body) });
}

test("Missing and unknown sessions are rejected", async () => {
  assert.equal((await request("/auth/me")).status, 401);
  assert.equal((await request("/auth/me", "GET", "unknown")).status, 401);
});

test("All three roles can inspect their authenticated session", async () => {
  for (const role of ["admin", "editor", "viewer"]) {
    const res = await request("/auth/me", "GET", role);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).user.role, role);
  }
});

test("Viewers cannot write and editors cannot delete or manage categories", async () => {
  for (const path of ["/diem-du-lich", "/co-so-dich-vu", "/loai-hinh", "/loai-dich-vu"]) {
    for (const method of ["POST", "PUT", "DELETE"]) {
      assert.equal((await request(path, method, "viewer", undefined, {})).status, 403);
    }
    assert.equal((await request(path, "DELETE", "editor")).status, 403);
  }
  for (const path of ["/loai-hinh", "/loai-dich-vu"]) {
    assert.equal((await request(path, "POST", "editor", undefined, {})).status, 403);
  }
  assert.equal((await request("/loai-hinh/all", "GET", "editor")).status, 403);
});

test("Admin and editor writes reach validation; viewers are denied", async () => {
  for (const role of ["admin", "editor"]) {
    for (const path of ["/diem-du-lich", "/co-so-dich-vu"]) {
      assert.equal((await request(path, "POST", role, undefined, {})).status, 400);
    }
  }
  assert.equal((await request("/loai-hinh", "POST", "admin", undefined, {})).status, 400);
});

test("Untrusted origins are rejected; both local frontend origins can logout", async () => {
  assert.equal((await request("/auth/logout", "POST", "admin", "https://untrusted.example")).status, 403);
  for (const origin of ["http://localhost:5173", "http://127.0.0.1:5173"]) {
    const res = await request("/auth/logout", "POST", "admin", origin);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), origin);
    assert.match(res.headers.get("set-cookie"), /tg_session=;/);
  }
});

test("Successful logins do not exhaust the five-failure limit", async () => {
  for (let i = 0; i < 6; i++) {
    const res = await request("/auth/login", "POST", undefined, undefined, { username: "admin", password: "test-password" });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("set-cookie"), /HttpOnly/);
    await res.arrayBuffer();
  }
  for (let i = 0; i < 5; i++) {
    const res = await request("/auth/login", "POST", undefined, undefined, { username: "admin", password: "wrong" });
    assert.equal(res.status, 401);
    await res.arrayBuffer();
  }
  const beforeCalls = loginCalls;
  assert.equal((await request("/auth/login", "POST", undefined, undefined, { username: "admin", password: "wrong" })).status, 429);
  assert.equal(loginCalls, beforeCalls);
});
