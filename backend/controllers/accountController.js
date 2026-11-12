const argon2 = require("argon2");
const { pool } = require("../config/db");
const { hashToken, COOKIE_NAME } = require("../middleware/auth");

const columns = "id, ten_dang_nhap, ho_ten, vai_tro, is_active, created_at";
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const validId = id => /^[1-9]\d{0,18}$/.test(String(id));

async function list(req, res, next) {
  try {
    const result = await pool.query(`SELECT ${columns} FROM tourism.tai_khoan ORDER BY id`);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
}

async function save(req, res, next) {
  const editing = req.method === "PUT";
  const { username, fullName, role, active, password } = req.body || {};
  if ((editing && !validId(req.params.id)) ||
      typeof username !== "string" || !/^[a-zA-Z0-9_.-]{3,60}$/.test(username) ||
      typeof fullName !== "string" || !fullName.trim() || fullName.trim().length > 150 ||
      !["admin", "editor", "viewer"].includes(role) || typeof active !== "boolean" ||
      (!editing && typeof password !== "string") ||
      (password !== undefined && password !== "" && (typeof password !== "string" || password.length < 8 || password.length > 1024)) ||
      (!editing && !password)) {
    return fail(res, 400, "Thông tin không hợp lệ. Tên đăng nhập 3–60 ký tự (chữ, số, _, ., -); mật khẩu 8–1024 ký tự.");
  }
  if (editing && String(req.user.id) === req.params.id && (role !== "admin" || !active)) {
    return fail(res, 409, "Không thể tự khóa hoặc hạ quyền tài khoản đang sử dụng.");
  }
  let client;
  try {
    const passwordHash = password ? await argon2.hash(password) : null;
    client = await pool.connect();
    await client.query("BEGIN");
    // Serialize account mutations so concurrent admins cannot remove the last admin.
    await client.query("LOCK TABLE tourism.tai_khoan IN SHARE ROW EXCLUSIVE MODE");
    if (editing) {
      const found = await client.query("SELECT id FROM tourism.tai_khoan WHERE id = $1", [req.params.id]);
      if (!found.rowCount) {
        await client.query("ROLLBACK");
        return fail(res, 404, "Không tìm thấy tài khoản.");
      }
      if (role !== "admin" || !active) {
        const admins = await client.query("SELECT id FROM tourism.tai_khoan WHERE vai_tro = 'admin' AND is_active = TRUE AND id <> $1", [req.params.id]);
        if (!admins.rowCount) {
          await client.query("ROLLBACK");
          return fail(res, 409, "Phải giữ ít nhất một quản trị viên hoạt động.");
        }
      }
    }
    const result = editing
      ? await client.query(`UPDATE tourism.tai_khoan SET ten_dang_nhap=$1, ho_ten=$2, vai_tro=$3, is_active=$4,
          mat_khau_hash=COALESCE($5, mat_khau_hash) WHERE id=$6 RETURNING ${columns}`,
        [username, fullName.trim(), role, active, passwordHash, req.params.id])
      : await client.query(`INSERT INTO tourism.tai_khoan (ten_dang_nhap, ho_ten, vai_tro, is_active, mat_khau_hash)
          VALUES ($1,$2,$3,$4,$5) RETURNING ${columns}`, [username, fullName.trim(), role, active, passwordHash]);
    if (editing) await client.query("DELETE FROM tourism.phien_dang_nhap WHERE tai_khoan_id=$1", [req.params.id]);
    await client.query("COMMIT");
    res.status(editing ? 200 : 201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    if (error.code === "23505") return fail(res, 409, "Tên đăng nhập đã tồn tại.");
    next(error);
  } finally { client?.release(); }
}

async function remove(req, res, next) {
  if (!validId(req.params.id)) return fail(res, 400, "Mã tài khoản không hợp lệ.");
  if (String(req.user.id) === req.params.id) return fail(res, 409, "Không thể tự xóa tài khoản đang sử dụng.");
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("LOCK TABLE tourism.tai_khoan IN SHARE ROW EXCLUSIVE MODE");
    const admins = await client.query("SELECT id FROM tourism.tai_khoan WHERE vai_tro='admin' AND is_active=TRUE AND id <> $1", [req.params.id]);
    if (!admins.rowCount) {
      await client.query("ROLLBACK");
      return fail(res, 409, "Phải giữ ít nhất một quản trị viên hoạt động.");
    }
    const result = await client.query("DELETE FROM tourism.tai_khoan WHERE id=$1 RETURNING id", [req.params.id]);
    await client.query("COMMIT");
    if (!result.rowCount) return fail(res, 404, "Không tìm thấy tài khoản.");
    res.json({ success: true });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    next(error);
  } finally { client?.release(); }
}

async function sessions(req, res, next) {
  try {
    const result = await pool.query(`SELECT s.token_hash, s.tai_khoan_id, s.created_at, s.expires_at,
        u.ten_dang_nhap, u.ho_ten FROM tourism.phien_dang_nhap s
        JOIN tourism.tai_khoan u ON u.id=s.tai_khoan_id
        WHERE s.expires_at > NOW() AND u.is_active=TRUE
        AND ($1::boolean OR s.tai_khoan_id=$2) ORDER BY s.created_at DESC`, [req.user.vai_tro === "admin", req.user.id]);
    const current = hashToken(req.cookies[COOKIE_NAME]);
    res.json({ success: true, data: result.rows.map(({ token_hash, ...row }) => ({ ...row, id: token_hash, current: token_hash === current })) });
  } catch (error) { next(error); }
}

async function revoke(req, res, next) {
  if (!/^[a-f0-9]{64}$/.test(req.params.id)) return fail(res, 400, "Mã phiên không hợp lệ.");
  try {
    const result = await pool.query(`DELETE FROM tourism.phien_dang_nhap WHERE token_hash=$1
      AND ($2::boolean OR tai_khoan_id=$3) RETURNING token_hash`, [req.params.id, req.user.vai_tro === "admin", req.user.id]);
    if (!result.rowCount) return fail(res, 404, "Không tìm thấy phiên đăng nhập.");
    res.json({ success: true });
  } catch (error) { next(error); }
}

module.exports = { list, save, remove, sessions, revoke };
