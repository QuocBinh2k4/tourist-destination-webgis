
const crypto = require("node:crypto");
const { pool } = require("../config/db");
const { getTrustedOrigins } = require("../config/origins");

const COOKIE_NAME = "tg_session";

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/.test(token)
    ) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập"
      });
    }

    const result = await pool.query(`
      SELECT
        u.id, u.ten_dang_nhap,
        u.ho_ten, u.vai_tro
      FROM tourism.phien_dang_nhap s
      JOIN tourism.tai_khoan u
        ON u.id = s.tai_khoan_id
      WHERE s.token_hash = $1
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
    `, [hashToken(token)]);

    if (!result.rowCount) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Chưa đăng nhập"
      });
    }

    if (!roles.includes(req.user.vai_tro)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện thao tác"
      });
    }

    next();
  };
}

// Kiểm tra nguồn của yêu cầu thay đổi dữ liệu
function requireTrustedOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const allowed = getTrustedOrigins();

  if (!allowed.includes(req.get("origin"))) {
    return res.status(403).json({
      success: false,
      message: "Nguồn yêu cầu không hợp lệ"
    });
  }

  next();
}

module.exports = {
  COOKIE_NAME,
  hashToken,
  requireAuth,
  allowRoles,
  requireTrustedOrigin
};
