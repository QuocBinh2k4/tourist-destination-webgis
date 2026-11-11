
const crypto = require("node:crypto");
const argon2 = require("argon2");

const { pool } = require("../config/db");
const {
  COOKIE_NAME,
  hashToken
} = require("../middleware/auth");

const SESSION_HOURS = 8;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api",
    maxAge: SESSION_HOURS * 60 * 60 * 1000
  };
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password ||
      username.length > 60 ||
      password.length > 1024
    ) {
      return res.status(400).json({
        success: false,
        message: "Thông tin đăng nhập không hợp lệ"
      });
    }

    const result = await pool.query(`
      SELECT id, ten_dang_nhap, mat_khau_hash,
             ho_ten, vai_tro
      FROM tourism.tai_khoan
      WHERE ten_dang_nhap = $1
        AND is_active = TRUE
    `, [username.trim()]);

    const user = result.rows[0];

    const valid = user
      ? await argon2.verify(user.mat_khau_hash, password)
      : false;

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng"
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await pool.query(`
      INSERT INTO tourism.phien_dang_nhap
        (token_hash, tai_khoan_id, expires_at)
      VALUES (
        $1, $2,
        NOW() + INTERVAL '8 hours'
      )
    `, [hashToken(token), user.id]);

    res.cookie(COOKIE_NAME, token, cookieOptions());

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.ten_dang_nhap,
        fullName: user.ho_ten,
        role: user.vai_tro
      }
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.ten_dang_nhap,
      fullName: req.user.ho_ten,
      role: req.user.vai_tro
    }
  });
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (
      typeof token === "string" &&
      /^[a-f0-9]{64}$/.test(token)
    ) {
      await pool.query(`
        DELETE FROM tourism.phien_dang_nhap
        WHERE token_hash = $1
      `, [hashToken(token)]);
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api"
    });

    res.json({
      success: true,
      message: "Đăng xuất thành công"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, me, logout };
