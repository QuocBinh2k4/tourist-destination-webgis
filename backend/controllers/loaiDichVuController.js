
const { pool } = require("../config/db");

function checkData(data) {
  const errors = [];

  if (
    typeof data.ma !== "string" ||
    !data.ma.trim() ||
    data.ma.length > 30
  ) errors.push("Mã loại dịch vụ không hợp lệ");

  if (
    typeof data.ten !== "string" ||
    !data.ten.trim() ||
    data.ten.length > 150
  ) errors.push("Tên loại dịch vụ không hợp lệ");

  if (
    data.mo_ta != null &&
    typeof data.mo_ta !== "string"
  ) errors.push("Mô tả không hợp lệ");

  if (
    data.is_active !== undefined &&
    typeof data.is_active !== "boolean"
  ) errors.push("Trạng thái không hợp lệ");

  return errors;
}

function parseId(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// Danh sách danh mục
async function getAll(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        l.id, l.ma, l.ten, l.mo_ta, l.is_active,
        (
          SELECT COUNT(*)::integer
          FROM tourism.co_so_dich_vu_loai lk
          WHERE lk.loai_dich_vu_id = l.id
        ) AS so_co_so
      FROM tourism.loai_dich_vu l
      ORDER BY l.id
    `);

    res.json({
      success: true,
      total: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

// Thêm loại dịch vụ
async function create(req, res, next) {
  try {
    const errors = checkData(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const result = await pool.query(`
      INSERT INTO tourism.loai_dich_vu
        (ma, ten, mo_ta, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      req.body.ma.trim(),
      req.body.ten.trim(),
      req.body.mo_ta || null,
      req.body.is_active ?? true
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// Cập nhật
async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const errors = checkData(req.body);

    if (!id || errors.length) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors
      });
    }

    const result = await pool.query(`
      UPDATE tourism.loai_dich_vu
      SET ma = $1,
          ten = $2,
          mo_ta = $3,
          is_active = $4
      WHERE id = $5
      RETURNING *
    `, [
      req.body.ma.trim(),
      req.body.ten.trim(),
      req.body.mo_ta || null,
      req.body.is_active ?? true,
      id
    ]);

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Không tìm thấy loại dịch vụ"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// Ngừng sử dụng danh mục
async function remove(req, res, next) {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "ID không hợp lệ"
      });
    }

    const result = await pool.query(`
      UPDATE tourism.loai_dich_vu
      SET is_active = FALSE
      WHERE id = $1
      RETURNING id, ma, ten, is_active
    `, [id]);

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Không tìm thấy loại dịch vụ"
      });
    }

    res.json({
      success: true,
      message: "Đã ngừng sử dụng loại dịch vụ",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  create,
  update,
  remove
};
