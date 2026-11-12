const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { pool } = require("../config/db");
const controller = require("../controllers/accountController");
const originalQuery = pool.query;
const originalConnect = pool.connect;
after(async () => { pool.query = originalQuery; pool.connect = originalConnect; await pool.end(); });
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
const next = error => { throw error; };

test("Account validation rejects invalid roles and short passwords", async () => {
  for (const data of [{ role: "owner", password: "password123" }, { role: "viewer", password: "short" }]) {
    const res = response();
    await controller.save({ method: "POST", body: { username: "user1", fullName: "User", active: true, ...data } }, res, next);
    assert.equal(res.statusCode, 400);
  }
});

test("Admins cannot delete, lock or demote themselves", async () => {
  const req = { method: "PUT", params: { id: "1" }, user: { id: 1 }, body: { username: "admin", fullName: "Admin", active: true, role: "viewer" } };
  const res = response();
  await controller.save(req, res, next);
  assert.equal(res.statusCode, 409);
  const deleted = response();
  await controller.remove(req, deleted, next);
  assert.equal(deleted.statusCode, 409);
});

test("Editing an account revokes its sessions inside the transaction", async () => {
  const calls = [];
  pool.connect = async () => ({
    query: async (sql, params) => { calls.push({ sql, params }); return { rowCount: 1, rows: [{ id: "2" }] }; },
    release() {},
  });
  const res = response();
  await controller.save({ method: "PUT", params: { id: "2" }, user: { id: 1 }, body: { username: "editor", fullName: "Editor", role: "editor", active: true } }, res, next);
  assert.equal(res.statusCode, 200);
  const revoked = calls.findIndex(call => call.sql.includes("DELETE FROM tourism.phien_dang_nhap"));
  assert.ok(revoked > 0);
  assert.deepEqual(calls[revoked].params, ["2"]);
  assert.equal(calls.at(-1).sql, "COMMIT");
});

test("Session revocation scopes non-admins to their own account", async () => {
  let params;
  pool.query = async (sql, values) => { assert.match(sql, /tai_khoan_id=\$3/); params = values; return { rowCount: 0 }; };
  const res = response();
  await controller.revoke({ params: { id: "a".repeat(64) }, user: { id: 7, vai_tro: "viewer" } }, res, next);
  assert.deepEqual(params, ["a".repeat(64), false, 7]);
  assert.equal(res.statusCode, 404);
});
